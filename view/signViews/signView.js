class SignView {
  #loginText = document.querySelector(".title-text .login");
  #loginForm = document.querySelector("form.login");
  #loginBtn = document.querySelector("label.login");
  #signupBtn = document.querySelector("label.signup");
  #signupLink = document.querySelector("form .signup-link a");
  #signupFullName = document.querySelector(".full-name-singup")
  #signupEmail = document.querySelector(".email-singup");
  #signupPassword = document.querySelector(".password-singup");
  #signupConfirmPassword = document.querySelector(".Cpassword-singup");
  #signupBtnClick = document.querySelector(".btn-signup");
  // #parent = document.querySelector("");
  // #spinner = document.querySelector("");

  constructor() {
    this.#setMoveListeners();

  }

  #setMoveListeners() {
    this.#signupBtn.onclick = (() => {
      this.#loginForm.style.marginLeft = "-50%";
      this.#loginText.style.marginLeft = "-50%";
    });
    this.#loginBtn.onclick = (() => {
      this.#loginForm.style.marginLeft = "0%";
      this.#loginText.style.marginLeft = "0%";
    });
    this.#signupLink.onclick = (() => {
      this.#signupBtn.click();
      return false;
    });
  }

  setSignUpHandler(handler) {
    this.#signupBtnClick.addEventListener('click', handler);
  }

  getInputData() {
    const Obj = {};
    Obj.name = this.#signupFullName.value;
    Obj.email = this.#signupEmail.value;
    Obj.password = this.#signupPassword.value;
    Obj.passwordConfirm = this.#signupConfirmPassword.value;
    return Obj;
  }

  toggleSpinner() {
    // this.#parent.classList.toggle('hidden');
    // this.#spinner.classList.toggle('hidden')
  }
}

export default new SignView();