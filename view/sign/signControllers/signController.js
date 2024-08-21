import signView from "../signViews/signView.js";
import { ajaxToServer } from "../signModels/signupModel.js";
// import 'core-js/stable';
// import 'regenerator-runtime/runtime.js'

const domain = document.body.dataset.domain;

const signUpHandler = async function(e) {
  e.preventDefault();

  const data = signView.getInputDataSignup();

  signView.toggleSpinner();

  const response = await ajaxToServer(`${domain}/api/v1/users/signup`, data);

  signView.toggleSpinner();

  if(response.status === 'success'){
    signView.showScucessMessage('تم انشاء حسابك بنجاح'); //TODO
    setTimeout(() => {
      location.assign('/');
    }, 1500);
}
  if(response.status === 'fail') {
    signView.showError(response);
  }
}

const setSignUpBtnClickListener = function() {
  signView.setSignUpHandler(signUpHandler);
}

const loginHandler = async function(e) {
  e.preventDefault();

  const data = signView.getInputDataLogin();

  signView.toggleSpinner();

  const response = await ajaxToServer(`${domain}/api/v1/users/login`, data);

  signView.toggleSpinner();

  if(response.status === 'success') {
    signView.showScucessMessage('تم تسجيل الدخول بنجاح');
      setTimeout(() => {
        location.assign('/');
      }, 1500)
  }
  if(response.status === 'fail') {
    signView.showError(response, 'login');
  }
}

const setLoginClickListener = function() {
  signView.setLoginHandler(loginHandler);
}

const init = function() {
  setSignUpBtnClickListener();
  setLoginClickListener();
}

init();