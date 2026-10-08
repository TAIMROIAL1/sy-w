// loaded at the top of <body> (not deferred) so dark mode applies before the page paints. Same localStorage key as the video page
if (localStorage.getItem('darkMode')) document.body.classList.add('page-dark-mode');
