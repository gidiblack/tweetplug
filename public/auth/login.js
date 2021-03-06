console.log('login connected');
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
    .querySelector('.login-box')
    .insertAdjacentHTML('beforebegin', markUp);
  window.setTimeout(hideAlert, 2000);
};

const login = async (username, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/user/login',
      data: {
        username,
        password,
      },
    });
    //console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    } else {
      console.log(fail);
    }
  } catch (error) {
    console.log(error.response.data);
    showAlert('error', error.response.data.message);
  }
};

const loginSub = document.getElementById('loginForm');

if (loginSub) {
  loginSub.addEventListener('submit', (e) => {
    console.log('clicked');
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('loginPassword').value;
    login(username, password);
  });
}
