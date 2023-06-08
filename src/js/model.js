
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId.js';
import i18next from 'i18next';
import render from './view.js';
import resources from '../locales/index.js';
import parser from './parser.js';

const defaultLanguage = 'ru';

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
      mixed: {
        notOneOf: 'feedback.errors.alreadyExists',
      },
      string: {
        url: 'feedback.errors.invalidURL',
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
          watchedState.data.feeds.push(feed);
          watchedState.form.processState = 'sent';
        })
        .catch((error) => {
          watchedState.form.valid = false;
          watchedState.form.processState = error;
        })
    });
  });
};