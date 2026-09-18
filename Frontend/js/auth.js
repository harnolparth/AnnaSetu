const $ = (x) => document.getElementById(x);
function tab(loginMode) {
  $("login").classList.toggle("hidden", !loginMode);
  $("register").classList.toggle("hidden", loginMode);
  $("lt").classList.toggle("active", loginMode);
  $("rt").classList.toggle("active", !loginMode);
}
function updateRegisterFields() {
  const r = $("rr").value;
  $("dt").classList.toggle("hidden", r !== "donor");
  $("vh").classList.toggle("hidden", r !== "volunteer");
}
$("lt").onclick = () => tab(true);
$("rt").onclick = () => tab(false);
$("rr").onchange = updateRegisterFields;
updateRegisterFields();
$("login").onsubmit = async (e) => {
  e.preventDefault();
  try {
    const d = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: $("email").value,
        password: $("pass").value,
        user_type: $("lr").value,
      }),
    });
    localStorage.setItem("annasetu_token", d.access_token);
    localStorage.setItem("annasetu_role", d.user_type);
    localStorage.setItem("annasetu_name", d.name || d.user_type);
    localStorage.setItem("annasetu_email", $("email").value);
    location.href = d.user_type + "/dashboard.html";
  } catch (x) {
    toast(x.message, true);
  }
};
$("register").onsubmit = async (e) => {
  e.preventDefault();
  const r = $("rr").value,
    d = {
      name: $("rn").value,
      email: $("re").value,
      phone: $("rp").value,
      address: $("ra").value,
      password: $("rpass").value,
    };
  if (r === "donor") d.donor_type = $("rd").value;
  if (r === "volunteer") d.vehicle = $("rv").value || null;
  try {
    await api("/api/auth/register/" + r, {
      method: "POST",
      body: JSON.stringify(d),
    });
    localStorage.setItem("annasetu_email", d.email);
    localStorage.setItem("annasetu_phone", d.phone);
    localStorage.setItem("annasetu_address", d.address);
    toast("Registration successful");
    tab(true);
    $("email").value = d.email;
    $("lr").value = r;
  } catch (x) {
    toast(x.message, true);
  }
};
