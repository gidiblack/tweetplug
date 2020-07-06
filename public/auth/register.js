console.log(' register connected');
const hideAlert = () => {
  const el = document.querySelector('.error-modal');
  if (el) el.parentElement.removeChild(el);
};
const showAlert = (type, message) => {
  hideAlert();
  const markUp = `<div id="errorModal" class="error-modal">
    <div class="modal-content-${type} container">
    <span class="close-modal">&times;</span>
    <p>${type}: <span id="errorMessage">${message}</span></p>
    </div>
    </div>`;
  document
    .querySelector('.signup-box')
    .insertAdjacentHTML('beforebegin', markUp);
  window.setTimeout(hideAlert, 2000);
};

const register = async (userObj) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/user/signup',
      data: userObj,
    });
    //console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Registered successfully');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    } else {
      console.log(fail);
    }
  } catch (error) {
    console.log(error.response.data);
    showAlert('error', error.response.data.message);
  }
};

document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const newUser = {
    firstname: document.getElementById('firstName').value,
    lastname: document.getElementById('lastName').value,
    username: document.getElementById('username').value,
    twitterhandle: document.getElementById('twitterHandle').value,
    gender: document.getElementById('gender').value,
    email: document.getElementById('email').value,
    mobileNumber: document.getElementById('mobileNumber').value,
    bankAccountName: document.getElementById('accountName').value,
    bankAccountNumber: document.getElementById('accountNumber').value,
    bank: document.getElementById('bank').value,
    password: document.getElementById('password').value,
    passwordConfirm: document.getElementById('passwordConfirm').value,
  };
  register(newUser);
});
