'use strict'

const container = document.querySelector('.container');

container.addEventListener('click', function(e) {
    const check = document.body.dataset.hasCamp;

    if(check !== 'hasCamp') return;

    const clicked = e.target;

    const subcourse = clicked.closest('.solving');

    if(!subcourse) return;

    const { subcourseId } = subcourse.dataset;

    location.assign(`/subcourses/${subcourseId}/lessons`)

})