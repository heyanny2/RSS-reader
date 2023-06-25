
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId.js';
import i18next from 'i18next';
import render from './view.js';
import resources from '../locales/index.js';
import parser from './parser.js';

const defaultLanguage = 'ru';
const timeout = 5000;

const validateLink = (link, rssLinks) => {
  const schema = yup.string().required().url().notOneOf(rssLinks);
  return schema.validate(link);
};

const axiosResponse = (url) => {
  const proxy = 'https://allorigins.hexlet.app/get';
  const newProxy = new URL(proxy);
  newProxy.searchParams.append('disableCache', 'true');
  newProxy.searchParams.append('url', url);
  return axios.get(newProxy);
};

const newPosts = (state) => {
  const promises = state.data.feeds
    .map(({ feedLink, feedId }) => axiosResponse(feedLink)
      .then((response) => {
        const { posts } = parser(response.data.contents);
        const addedPosts = state.data.posts.map((post) => post.postLink);
        const newPosts = posts.filter((post) => !addedPosts.includes(post.postLink));
        console.log(newPosts);
        if (newPosts.length > 0) {
          const preparedPosts = newPosts.map((post) => ({ ...post, feedId, id: uniqueId() }));
          state.data.posts = [...state.data.posts, ...preparedPosts];
        }
        return Promise.resolve();
      })
    )
  Promise.allSettled(promises)
    .finally(() => {
      setTimeout(() => newPosts(state), timeout);
    });
};

export default () => {
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: true,
    resources,
  }).then(() => {
    const elements = {
      form: document.querySelector('.rss-form'),
      input: document.querySelector('.form-control'),
      submitButton: document.querySelector('button[type="submit"]'),
      statusFeedback: document.querySelector('.feedback'),
      feeds: document.querySelector('.feeds'),
      posts: document.querySelector('.posts'),
    };

    yup.setLocale({
      string:{
        url: 'feedback.errors.invalidURL',
      },
      mixed: {
        notOneOf: 'feedback.errors.alreadyExists',
      },
    });

    const initialState = {
      form: {
        valid: true,
        processState: 'filling', //(filling, sent, error, sending)
        errors: {},
      },
      data: {
        feeds: [],
        posts: [],
      },
      uiState: {
      },
      rssLinks: [],
    };

    const watchedState = onChange(initialState, render(elements, initialState, i18nInstance));
    newPosts(watchedState);

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputValue = formData.get('url').trim();

      validateLink(inputValue, watchedState.rssLinks)
        .then(() => {
          watchedState.form.valid = true;
          watchedState.form.processState = 'sending';
          return axiosResponse(inputValue);
        })
        .then((response) => {
          const content = response.data.contents;
          const { feed, posts } = parser(content);
          const feedId = uniqueId();
          
          watchedState.rssLinks.push(inputValue);
          watchedState.data.feeds.push({ ...feed, feedId });
          
          watchedState.data.posts.push(...posts);
          watchedState.form.processState = 'sent';
        })
        .catch((error) => {
          console.log(error.message);         
          watchedState.form.valid = false;
          watchedState.form.processState = 'error';
          error.message = error.message === 'Parser error' ? 'feedback.errors.invalidURL' : error.message;
          watchedState.form.errors = error;
        })
    });
  });
};