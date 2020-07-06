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

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/user/logout',
    });
    //console.log(res);
    if ((res.data.status = 'success')) location.href = location.href;
    location.assign('/');
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'There was an error logging out please try again');
  }
};

const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
