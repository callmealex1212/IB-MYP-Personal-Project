document.addEventListener('DOMContentLoaded', function() {
    const whitelist = {
        'teacher1@example.com': { role: 'teacher', password: 'teacherPass1' },
        'teacher2@example.com': { role: 'teacher', password: 'teacherPass2' },
        'student1@example.com': { role: 'student', password: 'studentPass1' },
        'student2@example.com': { role: 'student', password: 'studentPass2' }
    };

    function generateTaskId() {
        return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            const user = whitelist[email];

            if (user && user.password === password) {
                localStorage.setItem('currentUser', JSON.stringify({ email, role: user.role }));
                alert('Login successful!');
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid credentials, please try again.');
            }
        });
    }

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const taskText = document.getElementById('taskText').value.trim();
            const taskDeadline = document.getElementById('taskDeadline').value;
            if (!taskText || !taskDeadline) return;

            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const newTask = {
                id: generateTaskId(),
                text: taskText,
                timestamp: Date.now(),
                deadline: new Date(taskDeadline).getTime()
            };
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            loadTasksForTeacher();
        });
    }

    function loadTasksForTeacher() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const tasksContainer = document.getElementById('tasksContainer');
        if (!tasksContainer) return;

        tasksContainer.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');

            const formattedDate = new Date(task.timestamp).toLocaleString();
            const deadlineDate = new Date(task.deadline).toLocaleDateString();

            taskElement.innerHTML = `
                <p><strong>Task:</strong> ${task.text}</p>
                <p><strong>Published On:</strong> ${formattedDate}</p>
                <p><strong>Deadline:</strong> ${deadlineDate}</p>
            `;

            const taskId = task.id;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-button';
            deleteButton.onclick = function() {
                deleteTask(taskId);
            };

            const updateButton = document.createElement('button');
            updateButton.textContent = 'Update';
            updateButton.className = 'update-button';
            updateButton.onclick = function() {
                updateTask(taskId);
            };

            taskElement.appendChild(deleteButton);
            taskElement.appendChild(updateButton);
            tasksContainer.appendChild(taskElement);
        });

        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<p>No tasks available</p>';
        }
    }

    function loadTasksForStudent(email) {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const submittedHomework = JSON.parse(localStorage.getItem('submittedHomework')) || {};
        const tasksContainer = document.getElementById('tasksContainer');
        if (!tasksContainer) return;

        tasksContainer.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            const formattedDate = new Date(task.timestamp).toLocaleString();
            const deadlineDate = new Date(task.deadline).toLocaleDateString();
            const currentDate = new Date();
            const deadlineDateTime = new Date(task.deadline);

            taskElement.innerHTML = `
                <p><strong>Task:</strong> ${task.text}</p>
                <p><strong>Published On:</strong> ${formattedDate}</p>
                <p><strong>Deadline:</strong> ${deadlineDate}</p>
            `;

            const taskId = task.id;
            let homeworkStatus = undefined;
            if (submittedHomework[email] && submittedHomework[email][taskId]) {
                homeworkStatus = submittedHomework[email][taskId].status;
            }

            const submitButton = document.createElement('button');

            if (currentDate > deadlineDateTime) {
                submitButton.textContent = 'Deadline Passed';
                submitButton.disabled = true;
                submitButton.classList.add('rejected-button');
            } else if (homeworkStatus === 'accepted') {
                submitButton.textContent = 'Completed';
                submitButton.disabled = true;
                submitButton.classList.add('accepted-button');
            } else if (homeworkStatus === 'rejected') {
                submitButton.textContent = 'Rejected';
                submitButton.classList.add('rejected-button');
                submitButton.onclick = function() {
                    window.location.href = `submitwork.html?task=${taskId}`;
                };
            } else if (homeworkStatus === 'submitted') {
                submitButton.textContent = 'Pending Review';
                submitButton.disabled = true;
                submitButton.classList.add('pending-button');
            } else {
                submitButton.textContent = 'Submit Homework';
                submitButton.classList.add('submit-button');
                submitButton.onclick = function() {
                    window.location.href = `submitwork.html?task=${taskId}`;
                };
            }

            taskElement.appendChild(submitButton);
            tasksContainer.appendChild(taskElement);
        });
    }

    function deleteTask(taskId) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        deleteSubmissionsForTask(taskId);

        loadTasksForTeacher();
    }

    function deleteSubmissionsForTask(taskId) {
        let submittedHomework = JSON.parse(localStorage.getItem('submittedHomework')) || {};
        for (const email in submittedHomework) {
            if (submittedHomework[email][taskId]) {
                delete submittedHomework[email][taskId];
            }
        }
        localStorage.setItem('submittedHomework', JSON.stringify(submittedHomework));
    }

    function updateTask(taskId) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;

        const newTaskText = prompt('Update the task:', tasks[taskIndex].text);
        if (newTaskText !== null && newTaskText.trim() !== '') {
            tasks[taskIndex].text = newTaskText.trim();
            localStorage.setItem('tasks', JSON.stringify(tasks));
            loadTasksForTeacher();
        }
    }

    function loadDiscussions() {
        const discussions = JSON.parse(localStorage.getItem('discussions')) || [];
        const discussionsContainer = document.getElementById('discussionsContainer');
        if (!discussionsContainer) return;

        discussionsContainer.innerHTML = '';

        discussions.forEach((discussion, index) => {
            const discussionElement = document.createElement('p');
            discussionElement.textContent = discussion;
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.role === 'teacher') {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-button';
                deleteButton.onclick = function() {
                    deleteDiscussion(index);
                };
                discussionElement.appendChild(deleteButton);
            }

            discussionsContainer.appendChild(discussionElement);
        });
    }

    function deleteDiscussion(index) {
        let discussions = JSON.parse(localStorage.getItem('discussions')) || [];
        discussions.splice(index, 1);
        localStorage.setItem('discussions', JSON.stringify(discussions));
        loadDiscussions();
    }

    const discussionForm = document.getElementById('discussionForm');
    if (discussionForm) {
        discussionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const discussionText = document.getElementById('discussionText').value.trim();
            if (!discussionText) return;

            let discussions = JSON.parse(localStorage.getItem('discussions')) || [];
            discussions.push(discussionText);
            localStorage.setItem('discussions', JSON.stringify(discussions));
            loadDiscussions();
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            alert('You have been logged out.');
            window.location.href = 'login.html';
        });
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        if (document.getElementById('tasksContainer')) {
            if (currentUser.role === 'teacher') {
                loadTasksForTeacher();
            } else {
                loadTasksForStudent(currentUser.email);
            }
        }
        if (document.getElementById('discussionsContainer')) {
            loadDiscussions();
        }
    }
});