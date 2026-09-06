const sections = document.querySelectorAll('section');
const menuBtns = document.querySelectorAll('.menu-item');
const menu = document.querySelector('.sidebar');

const listToggleInput = document.getElementById('menu-toggle');

const toggle = document.getElementById("dark-toggle");

menu.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('.menu-item');

    if(!menuBtn || menuBtn.classList.contains('active')) return;


    const itemNumber = Number([...menuBtn.classList].find(className => className.startsWith('item-number')).split('-')[2]);


    menuBtns.forEach(mb => mb.classList.contains(`item-number-${itemNumber}`) ? mb.classList.add('active') : mb.classList.remove('active'));
    sections.forEach(sec => sec.classList.add('hidden'));

    sections.forEach(sec => sec.classList.contains(`section-${itemNumber}`)? sec.classList.remove('hidden') : sec.classList.add('hidden'));
    
    closeList();
})

toggle.addEventListener("change", () => {
    document.body.classList.toggle("page-dark-mode");
});

function closeList () {
    listToggleInput.checked = false;
}