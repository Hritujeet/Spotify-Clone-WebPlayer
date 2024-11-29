const hamburger = document.getElementById("hamburger");
const cross = document.getElementById("cross");
const sidebar = document.querySelector(".left");


hamburger.addEventListener("click", ()=>{
    sidebar.classList.add("responsiveLeft")
})

cross.addEventListener("click", ()=>{
    sidebar.classList.remove("responsiveLeft")
})
