const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const addTaskButton = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const clearAllButton = document.getElementById('clearAll');
const modeToggle = document.getElementById('modeToggle');
const modeIcon = document.getElementById('modeIcon');
const sortTasks = document.getElementById('sortTasks');
const notificationContainer = document.getElementById('notificationContainer');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let isNightMode = JSON.parse(localStorage.getItem('isNightMode')) || false;

function renderTasks() {
    taskList.innerHTML = '';
    const sortedTasks = sortTasksBy(tasks, sortTasks.value);
    sortedTasks.forEach((task, index) => {
        const li = document.createElement('li');
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        
        const taskText = document.createElement('span');
        taskText.textContent = task.text;
        taskInfo.appendChild(taskText);
        
        if (task.dueDate) {
            const taskDue = document.createElement('span');
            taskDue.className = 'task-due';
            taskDue.textContent = `Due: ${formatDate(task.dueDate)}`;
            taskInfo.appendChild(taskDue);
        }
        
        li.appendChild(taskInfo);
        li.onclick = () => toggleTask(index);
        if (task.completed) {
            li.classList.add('completed');
        }

        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTask(index);
        };

        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
    saveTasks();
}

function addTask() {
    const text = taskInput.value.trim();
    const date = taskDate.value;
    const time = taskTime.value;
    if (text) {
        const dueDate = date && time ? new Date(`${date}T${time}`) : null;
        const newTask = { text, completed: false, dueDate, id: Date.now() };
        tasks.push(newTask);
        taskInput.value = '';
        taskDate.value = '';
        taskTime.value = '';
        renderTasks();
        if (dueDate) {
            scheduleNotification(newTask);
        }
    }
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
    if (tasks[index].completed && tasks[index].dueDate) {
        cancelNotification(tasks[index].id);
    }
}

function deleteTask(index) {
    if (tasks[index].dueDate) {
        cancelNotification(tasks[index].id);
    }
    tasks.splice(index, 1);
    renderTasks();
}

function clearAllTasks() {
    tasks.forEach(task => {
        if (task.dueDate) {
            cancelNotification(task.id);
        }
    });
    tasks = [];
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function toggleNightMode() {
    isNightMode = !isNightMode;
    document.body.classList.toggle('night-mode', isNightMode);
    modeIcon.textContent = isNightMode ? '🌜' : '🌞';
    localStorage.setItem('isNightMode', JSON.stringify(isNightMode));
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('en-US', options);
}

function sortTasksBy(tasks, criterion) {
    return [...tasks].sort((a, b) => {
        if (criterion === 'due') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        // Default sort by date added
        return a.id - b.id;
    });
}

function scheduleNotification(task) {
    const now = new Date();
    const timeUntilDue = new Date(task.dueDate) - now;
    
    if (timeUntilDue > 0) {
        setTimeout(() => {
            if (!task.completed) {
                showNotification(task);
            }
        }, timeUntilDue);
    }
}

function cancelNotification(taskId) {
    // Remove the notification if it exists
    const notification = document.getElementById(`notification-${taskId}`);
    if (notification) {
        notification.remove();
    }
}

function showNotification(task) {
    // Try to show a browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Task Due', {
            body: `Your task "${task.text}" is now due!`,
            icon: '/path/to/icon.png' // Add an icon path if you have one
        });
    }

    // Always show an in-app notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.id = `notification-${task.id}`;
    notification.innerHTML = `
        <span>Task Due: ${task.text}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    notificationContainer.appendChild(notification);

    // Remove the notification after 10 seconds
    setTimeout(() => notification.remove(), 10000);
}

function checkOverdueTasks() {
    const now = new Date();
    tasks.forEach(task => {
        if (task.dueDate && new Date(task.dueDate) <= now && !task.completed) {
            showNotification(task);
        }
    });
}

addTaskButton.onclick = addTask;
taskInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
};
clearAllButton.onclick = clearAllTasks;
modeToggle.onclick = toggleNightMode;
sortTasks.onchange = renderTasks;

// Initialize night mode
document.body.classList.toggle('night-mode', isNightMode);
modeIcon.textContent = isNightMode ? '🌜' : '🌞';

// Request notification permission
if ('Notification' in window) {
    Notification.requestPermission();
}

// Check for overdue tasks on page load and every minute
checkOverdueTasks();
setInterval(checkOverdueTasks, 60000);

// Reschedule notifications for existing tasks
tasks.forEach(task => {
    if (task.dueDate && !task.completed) {
        scheduleNotification(task);
    }
});

renderTasks();
