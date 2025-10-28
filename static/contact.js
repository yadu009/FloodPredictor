const form = document.getElementById('contactForm');
const feedback = document.getElementById('formFeedback');

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    if(!name || !email || !subject || !message){
        feedback.style.color = 'red';
        feedback.textContent = 'Please fill in all fields correctly.';
        return;
    }

    try {
        const response = await fetch('/submit_contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, subject, message })
        });

        const result = await response.json();
        if(result.status === 'success'){
            feedback.style.color = 'green';
            feedback.textContent = 'Thank you! Your message has been sent.';
            form.reset();
        } else {
            feedback.style.color = 'red';
            feedback.textContent = 'Something went wrong. Try again later.';
        }
    } catch(err) {
        feedback.style.color = 'red';
        feedback.textContent = 'Server error. Try again later.';
        console.error(err);
    }

    setTimeout(() => { feedback.textContent = ''; }, 4000);
});
