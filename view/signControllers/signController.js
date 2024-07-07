class SignView {
  #loginText = document.querySelector(".title-text .login");
  #loginForm = document.querySelector("form.login");
  #loginBtn = document.querySelector("label.login");
  #signupBtn = document.querySelector("label.signup");
  #signupLink = document.querySelector("form .signup-link a");

  constructor() {
    this.#setMoveListeners();
    console.log(this.#loginBtn);
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

  getInputData() {

  }
}

const signView = new SignView();