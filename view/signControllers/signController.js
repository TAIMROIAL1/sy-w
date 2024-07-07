import signView from "../signViews/signView.js";
import { ajaxToServer } from "../signModels/signupModel.js";

const signUpHandler = async function(e) {
  e.preventDefault();

  const data = signView.getInputData();

  signView.toggleSpinner();

  const response = await ajaxToServer('http://127.0.0.1:3000/api/v1/users/signup', data);

  signView.toggleSpinner();

  if(response.status === 'success'){
    // signView.showScucessMessage(); //TODO
    setTimeout(() => {
      //TODO Login user
    }, 2000);
}
  if(response.status === 'fail') {
    // signView.showError(response); //TODO
  }
}

const setSignUpBtnClickListener = function() {
  signView.setSignUpHandler(signUpHandler);
}

const init = function() {
  setSignUpBtnClickListener();
}

init();