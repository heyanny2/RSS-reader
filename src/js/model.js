
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import render from './view.js';
import i18next from 'i18next';
import resources from '../locales/index.js';

const defaultLanguage = 'ru';

const validateLink = (link, rssLinks) => {
  const schema = yup.string().required().url().notOneOf(rssLinks);
  return schema.validate(link);
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
    };

    yup.setLocale({
      mixed: {
        notOneOf: 'alreadyExists',
      },
      string: {
        url: 'invalidURL',
      },
    });

    const initialState = {
      form: {
        valid: true,
        processState: 'filling', //(filling, sent, error, sending)
        errors: {},
      },
      data: {
        feedList: [],
        postList: [],
      },
      uiState: {
      },
      rssLinks: [],
    };

    const watchedState = onChange(initialState, render(elements, initialState, i18nInstance));

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const link = formData.get('url').trim();

      validateLink(link, watchedState.rssLinks)
        .then(() => {
          watchedState.form.valid = true;
        })
        .catch((error) => {
          watchedState.form.valid = false;
          watchedState.form.processState = 'error';
        })
    });
  });
};