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
  #login = document.querySelector(".login");
  #signup = document.querySelector(".signup");
  #formContainer = document.querySelector(".form-container");
  #check = document.querySelector(".wrappeer");
  #spinner = document.querySelector('.spinner');

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
    this.#login.classList.toggle('hidden');
    this.#signup.classList.toggle('hidden');
    this.#formContainer.classList.toggle('hidden');
    this.#check.classList.add('hidden');
    this.#spinner.classList.toggle('hidden');
  }

  showScucessMessage() {
    this.#check.classList.remove('hidden');
    this.#login.classList.toggle('hidden');
    this.#signup.classList.toggle('hidden');
    this.#formContainer.classList.toggle('hidden');
  }

  showError(response) {
    const errs = [...document.querySelectorAll('.error')];
    errs.forEach(err => {
      err.classList.add('hidden');
    })
      const errDiv = document.querySelector(`.error-${response.path}`);
      errDiv.classList.remove('hidden');
      const msgDiv = errDiv.querySelector('.error-message');
      msgDiv.textContent = response.message.slice(17).split(',')[0];
    }
  }

export default new SignView();