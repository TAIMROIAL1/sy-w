import signView from "../signViews/signView.js";
import { ajaxToServer } from "../signModels/signupModel.js";

const signUpHandler = async function(e) {
  e.preventDefault();

  const data = signView.getInputData();

  await ajaxToServer('http://127.0.0.1:3000/api/v1/users/signup', data);
}

const setSignUpBtnClickListener = function() {
  signView.setSignUpHandler(signUpHandler);
}

const init = function() {
  setSignUpBtnClickListener();
}

init();