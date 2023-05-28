const handleProcess = (elements, initialState, value, i18next) => {
  switch (value) {
    case 'sending': {
      elements.submitButton.disabled = true;
      break;
    }
    case 'sent': {
      elements.submitButton.disabled = false;
      elements.form.reset();
      elements.input.focus();
      elements.input.classList.remove('is-invalid');
      elements.statusFeedback.classList.remove('text-danger');
      elements.statusFeedback.classList.add('text-success');
      elements.statusFeedback.textContent = i18next.t('feedback.success');
      break;
    }
    case 'error': {
      elements.submitButton.disabled = false;
      elements.statusFeedback.classList.add('text-danger');
      elements.statusFeedback.classList.remove('text-success');
      break;
    }
    default:
      break;
  }
};

const handleValidation = (elements, valid) => {
  if (valid === true) {
    elements.input.classList.remove('is-invalid');
    return;
  }
  if (valid === false) {
    elements.input.classList.add('is-invalid');
  }
};

const handleError = (elements, error) => {
  const { errorMessage } = error;
  elements.statusFeedback.textContent = errorMessage;
};

export default (elements, initialState, i18n) => (path, value) => {
  switch (path) {
    case 'form.valid': {
      handleValidation(elements, value);
      break;
    }
    case 'form.processState': {
      handleProcess(elements, initialState, value, i18next);
    }
    case 'form.errors': {
      handleError(elements, value, i18next);
      break;
    }
    default:
      break;
  }
};
