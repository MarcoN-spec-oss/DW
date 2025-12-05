document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'planner_data_v1';
  const SEED = 'js/data.json';
  const toastTime = 1500;
  const toast = (t) => {
    let el = document.getElementById('app-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-msg';
      Object.assign(el.style, { position: 'fixed', right: '16px', top: '16px', background:'#222', color:'#fff', padding:'8px 12px', borderRadius:'6px', zIndex:9999 });
      document.body.appendChild(el);
    }
    el.textContent = t;
    setTimeout(() => el.textContent = '', toastTime);
  };
  const read = () => JSON.parse(localStorage.getItem(KEY) || 'null');
  const write = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const uid = (p='') => p + Date.now().toString(36) + Math.floor(Math.random()*1000).toString(36);
  const esc = s => String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const init = async () => {
    if (read()) return;
    try {
      const r = await fetch(SEED, {cache:'no-store'});
      const j = await r.json();
      const data = {
        tareas: (j.tareas||[]).map(t => ({ id: t.id || uid('t'), title: t.title||'', date: t.date||'', time: t.time||'', description: t.description||'', subject: t.subject||'', teacher: t.teacher||'', completed: !!t.completed })),
        eventos: (j.eventos||[]).map(e => ({ id: e.id || uid('e'), title: e.title||'', date: e.date||'', time: e.time||'', description: e.description||'', location: e.location||'', category: e.category||'', completed: !!e.completed }))
      };
      write(data);
    } catch (e) {
      write({ tareas: [], eventos: [] });
    }
  };
  const render = () => {
    const path = window.location.pathname.split('/').pop();
    const isVisual = path === 'visualizacion.html';

    const tasksTable = document.getElementById('tasksTable');
    const eventsTable = document.getElementById('eventsTable');
    if (!isVisual) {
      if (tasksTable) tasksTable.style.display = 'none';
      if (eventsTable) eventsTable.style.display = 'none';
      return;
    }
    if (tasksTable) tasksTable.style.display = '';
    if (eventsTable) eventsTable.style.display = '';
    const data = read() || { tareas: [], eventos: [] };
    const rt = document.querySelector('#tasksTable tbody');
    if (rt) {
      rt.innerHTML = '';
      (data.tareas||[]).sort((a,b) => ((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||'')))
        .forEach(it => {
          const tr = document.createElement('tr');
          tr.dataset.id = it.id;
          tr.innerHTML = `
            <td>${esc(it.title)}</td>
            <td>${esc(it.date)}</td>
            <td>${esc(it.time)}</td>
            <td>${esc(it.subject)}</td>
            <td>${esc(it.teacher)}</td>
            <td style="text-align:center">
              <input type="checkbox" class="complete-toggle" ${it.completed ? 'checked' : ''}>
              <div style="font-size:0.9em">${it.completed ? 'Entregado' : 'Pendiente'}</div>
            </td>
            <td><button class="edit">Editar</button> <button class="del">Eliminar</button></td>
          `;
          rt.appendChild(tr);
      });
    }
    const re = document.querySelector('#eventsTable tbody');
    if (re) {
      re.innerHTML = '';
      (data.eventos||[]).sort((a,b) => ((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||'')))
        .forEach(it => {
          const tr = document.createElement('tr');
          tr.dataset.id = it.id;
          tr.innerHTML = `
            <td>${esc(it.title)}</td>
            <td>${esc(it.date)}</td>
            <td>${esc(it.time)}</td>
            <td>${esc(it.location)}</td>
            <td style="text-align:center">
              <input type="checkbox" class="complete-toggle" ${it.completed ? 'checked' : ''}>
              <div style="font-size:0.9em">${it.completed ? 'Realizado' : 'Pendiente'}</div>
            </td>
            <td><button class="edit">Editar</button> <button class="del">Eliminar</button></td>
          `;
          re.appendChild(tr);
      });
    }
  };
  const add = (kind, obj) => {
    const d = read() || { tareas: [], eventos: [] };
    obj.id = uid(kind==='tarea' ? 't' : 'e');
    obj.completed = false;
    if (kind==='tarea') d.tareas.push(obj); else d.eventos.push(obj);
    write(d); render(); toast(kind==='tarea' ? 'Tarea guardada' : 'Evento guardado');
  };
  const remove = (kind, id) => {
    const d = read() || { tareas: [], eventos: [] };
    if (kind==='tarea') d.tareas = d.tareas.filter(x=>x.id!==id); else d.eventos = d.eventos.filter(x=>x.id!==id);
    write(d); render(); toast('Eliminado');
  };
  const update = (kind, id, patch) => {
    const d = read() || { tareas: [], eventos: [] };
    const arr = kind==='tarea' ? d.tareas : d.eventos;
    const i = arr.findIndex(x=>x.id===id);
    if (i===-1) return;
    arr[i] = { ...arr[i], ...patch };
    write(d); render(); toast('Actualizado');
  };
  (async () => {
    await init();
    render();
    const tf = document.getElementById('taskForm');
    if (tf) {
      tf.addEventListener('submit', e => {
        e.preventDefault();
        const task = {
          title: tf.querySelector('[name="title"]').value.trim(),
          date: tf.querySelector('[name="date"]').value,
          time: tf.querySelector('[name="time"]').value,
          description: tf.querySelector('[name="description"]').value.trim(),
          subject: tf.querySelector('[name="subject"]').value.trim(),
          teacher: tf.querySelector('[name="teacher"]').value.trim()
        };
        if (!task.title || !task.date) return toast('Título y fecha obligatorios');
        add('tarea', task);
        tf.reset();
      });
      const tb = document.querySelector('#tasksTable tbody');
      if (tb) {
        tb.addEventListener('click', ev => {
          const tr = ev.target.closest('tr'); if (!tr) return;
          const id = tr.dataset.id;
          if (ev.target.classList.contains('del')) { if (confirm('Eliminar tarea?')) remove('tarea', id); }
          else if (ev.target.classList.contains('edit')) {
            const d = read().tareas.find(x=>x.id===id);
            if (!d) return;
            const t = prompt('Título', d.title); if (t===null) return;
            const dt = prompt('Fecha (YYYY-MM-DD)', d.date); if (dt===null) return;
            const tm = prompt('Hora (HH:MM)', d.time||''); if (tm===null) return;
            const sub = prompt('Materia', d.subject||''); if (sub===null) return;
            const te = prompt('Docente', d.teacher||''); if (te===null) return;
            const desc = prompt('Descripción', d.description||''); if (desc===null) return;
            update('tarea', id, { title: t.trim(), date: dt, time: tm, subject: sub.trim(), teacher: te.trim(), description: desc.trim() });
          }
        });
        tb.addEventListener('change', ev => {
          if (!ev.target.classList.contains('complete-toggle')) return;
          const tr = ev.target.closest('tr'); if (!tr) return;
          update('tarea', tr.dataset.id, { completed: !!ev.target.checked });
        });
      }
    }
    const ef = document.getElementById('eventForm');
    if (ef) {
      ef.addEventListener('submit', e => {
        e.preventDefault();
        const evObj = {
          title: ef.querySelector('[name="title"]').value.trim(),
          date: ef.querySelector('[name="date"]').value,
          time: ef.querySelector('[name="time"]').value,
          description: ef.querySelector('[name="description"]').value.trim(),
          location: ef.querySelector('[name="location"]').value.trim(),
          category: ef.querySelector('[name="category"]').value || ''
        };
        if (!evObj.title || !evObj.date) return toast('Título y fecha obligatorios');
        add('evento', evObj);
        ef.reset();
      });
      const eb = document.querySelector('#eventsTable tbody');
      if (eb) {
        eb.addEventListener('click', ev => {
          const tr = ev.target.closest('tr'); if (!tr) return;
          const id = tr.dataset.id;
          if (ev.target.classList.contains('del')) { if (confirm('Eliminar evento?')) remove('evento', id); }
          else if (ev.target.classList.contains('edit')) {
            const d = read().eventos.find(x=>x.id===id);
            if (!d) return;
            const t = prompt('Título', d.title); if (t===null) return;
            const dt = prompt('Fecha (YYYY-MM-DD)', d.date); if (dt===null) return;
            const tm = prompt('Hora (HH:MM)', d.time||''); if (tm===null) return;
            const loc = prompt('Lugar', d.location||''); if (loc===null) return;
            const cat = prompt('Categoría', d.category||''); if (cat===null) return;
            const desc = prompt('Descripción', d.description||''); if (desc===null) return;
            update('evento', id, { title: t.trim(), date: dt, time: tm, location: loc.trim(), category: cat.trim(), description: desc.trim() });
          }
        });
        eb.addEventListener('change', ev => {
          if (!ev.target.classList.contains('complete-toggle')) return;
          const tr = ev.target.closest('tr'); if (!tr) return;
          update('evento', tr.dataset.id, { completed: !!ev.target.checked });
        });
      }
    }
    window.addEventListener('storage', (e) => { if (e.key === KEY) render(); });
  })();
});
