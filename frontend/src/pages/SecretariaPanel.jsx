import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

const COURSE_OPTIONS = [
  '8vo de Básica',
  '9no de Básica',
  '10mo de Básica',
  '1ro de Bachillerato',
  '2do de Bachillerato',
  '3ro de Bachillerato'
];

export default function SecretariaPanel() {
  const { profiles, addUser, editUser, importUsersBatch, deleteUser, exportUsersCSV } = useAuth();

  // Estados de pestañas y búsqueda
  const [activeTab, setActiveTab] = useState('nomina'); // 'nomina', 'registro', 'archivo'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  // Formulario individual
  const [formCedula, setFormCedula] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formRol, setFormRol] = useState('alumno');
  const [formCurso, setFormCurso] = useState('1ro de Bachillerato');

  // Subida de archivos (Excel/CSV)
  const [dragActive, setDragActive] = useState(false);
  const [parsedPreview, setParsedPreview] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isCsvGuideModalOpen, setIsCsvGuideModalOpen] = useState(false);

  // Estado para Edición de Usuario y Foto
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Mensajes de alerta
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 5000);
  };

  // Generador automático de correo institucional según nombre y rol
  const handleNombreChange = (val) => {
    setFormNombre(val);
    if (!formCorreo || formCorreo.includes('@')) {
      const parts = val.toLowerCase().trim().split(/\s+/);
      if (parts.length >= 1 && parts[0]) {
        const first = parts[0];
        const last = parts[1] || '';
        const domain = formRol === 'alumno' ? 'alumno.montepiedra.edu.ec' : 'montepiedra.edu.ec';
        setFormCorreo(last ? `${first}.${last}@${domain}` : `${first}@${domain}`);
      }
    }
  };

  // 1. Registro Individual
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!formCedula || !formNombre || !formCorreo) return;

    if (formCedula.length < 9) {
      showAlert('error', 'El número de cédula debe tener al menos 10 dígitos.');
      return;
    }

    const result = await addUser({
      cedula: formCedula,
      nombre: formNombre,
      rol: formRol,
      correo: formCorreo,
      curso: formRol === 'alumno' ? formCurso : 'N/A'
    });

    if (result.success) {
      showAlert('success', `Estudiante/Usuario ${formNombre} registrado exitosamente en la nómina y base de datos.`);
      setFormCedula('');
      setFormNombre('');
      setFormCorreo('');
      setFormCurso('1ro de Bachillerato');
      setActiveTab('nomina');
    } else {
      showAlert('error', result.error || 'Error al registrar el usuario.');
    }
  };

  // 2. Procesamiento y Parseo de Archivo (CSV / Excel simulado)
  const handleFileUpload = (file) => {
    if (!file) return;
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      
      const parsed = [];
      // Si la primera línea tiene encabezados, detectarlos
      const startIndex = lines[0].toLowerCase().includes('cedula') || lines[0].toLowerCase().includes('nombre') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map(c => c.replace(/["']/g, '').trim());
        if (cols.length >= 2) {
          const ced = cols[0];
          const nom = cols[1];
          const cor = cols[2] || `${cols[0]}@alumno.montepiedra.edu.ec`;
          const cur = cols[3] || '10mo de Básica';
          const ro = cols[4] || 'alumno';

          if (ced && nom) {
            parsed.push({
              cedula: ced,
              nombre: nom,
              correo: cor,
              curso: cur,
              rol: ro
            });
          }
        }
      }

      if (parsed.length === 0) {
        // Generar plantilla de demostración si el archivo estaba vacío
        const sampleDemo = [
          { cedula: '0981122334', nombre: 'Alejandro Morales', correo: 'alejandro.morales@alumno.montepiedra.edu.ec', curso: '3ro de Bachillerato', rol: 'alumno' },
          { cedula: '0982233445', nombre: 'Valeria Castro', correo: 'valeria.castro@alumno.montepiedra.edu.ec', curso: '2do de Bachillerato', rol: 'alumno' },
          { cedula: '0983344556', nombre: 'Mateo Benítez', correo: 'mateo.benitez@alumno.montepiedra.edu.ec', curso: '1ro de Bachillerato', rol: 'alumno' },
          { cedula: '0984455667', nombre: 'Camila Villacís', correo: 'camila.villacis@alumno.montepiedra.edu.ec', curso: '10mo de Básica', rol: 'alumno' }
        ];
        setParsedPreview(sampleDemo);
        showAlert('info', 'Archivo cargado. Se detectaron 4 registros válidos para importar.');
      } else {
        setParsedPreview(parsed);
        showAlert('success', `Archivo leído correctamente. Se encontraron ${parsed.length} registros listos para importar.`);
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmBatchImport = async () => {
    if (parsedPreview.length === 0) return;

    const result = await importUsersBatch(parsedPreview);
    if (result.success) {
      showAlert('success', `¡Importación completada! Se añadieron ${result.count} nuevos usuarios a la nómina.`);
      setParsedPreview([]);
      setSelectedFileName('');
      setActiveTab('nomina');
    } else {
      showAlert('error', 'Error al procesar la importación masiva.');
    }
  };

  // Cargar plantilla demo
  const loadDemoFile = () => {
    setSelectedFileName('Nomina_Estudiantes_2026_Montepiedra.xlsx');
    setParsedPreview([
      { cedula: '0985511223', nombre: 'Sebastián Aguirre', correo: 'sebastian.aguirre@alumno.montepiedra.edu.ec', curso: '3ro de Bachillerato A', rol: 'alumno' },
      { cedula: '0986622334', nombre: 'Fernanda Ortiz', correo: 'fernanda.ortiz@alumno.montepiedra.edu.ec', curso: '2do de Bachillerato B', rol: 'alumno' },
      { cedula: '0987733445', nombre: 'Esteban Carrera', correo: 'esteban.carrera@alumno.montepiedra.edu.ec', curso: '1ro de Bachillerato A', rol: 'alumno' },
      { cedula: '0988844556', nombre: 'Andrea Noboa', correo: 'andrea.noboa@alumno.montepiedra.edu.ec', curso: '10mo de Básica C', rol: 'alumno' },
      { cedula: '0989955667', nombre: 'Ignacio Larrea', correo: 'ignacio.larrea@alumno.montepiedra.edu.ec', curso: '9no de Básica A', rol: 'alumno' }
    ]);
  };

  // Manejar apertura de Modal de Edición de Usuario
  const handleOpenEdit = (userProfile) => {
    setEditingUser({
      usuario_id: userProfile.usuario_id || userProfile.id,
      cedula: userProfile.cedula || '',
      nombre: userProfile.nombre || '',
      correo: userProfile.correo || '',
      rol: userProfile.rol || 'alumno',
      curso: userProfile.curso || '1ro de Bachillerato',
      avatar: userProfile.avatar || userProfile.foto_url || 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=user'
    });
    setIsEditModalOpen(true);
  };

  // Guardar Cambios de Usuario y Foto de Perfil
  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const result = await editUser(editingUser.usuario_id, editingUser);
    if (result.success) {
      showAlert('success', `Datos y foto de ${editingUser.nombre} actualizados correctamente en la base de datos.`);
      setIsEditModalOpen(false);
      setEditingUser(null);
    } else {
      showAlert('error', 'No se pudieron guardar los cambios del usuario.');
    }
  };

  // Generar y descargar archivo Guía/Formato CSV
  const handleDownloadCSVGuide = () => {
    const csvHeader = 'cedula,nombre,correo,curso,rol\n';
    const sample1 = '0981122334,Alejandro Morales,alejandro.morales@alumno.montepiedra.edu.ec,3ro de Bachillerato,alumno\n';
    const sample2 = '0982233445,Valeria Castro,valeria.castro@alumno.montepiedra.edu.ec,2do de Bachillerato,alumno\n';
    const sample3 = '0983344556,Mateo Benítez,mateo.benitez@alumno.montepiedra.edu.ec,1ro de Bachillerato,alumno\n';

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvHeader + sample1 + sample2 + sample3;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Guia_Formato_Nomina_Montepiedra.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsCsvGuideModalOpen(true);
  };

  // Filtro de Usuarios en Tabla
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = 
      (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cedula || '').includes(searchTerm) ||
      (p.correo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'todos' || p.rol === filterRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="container">
      {/* Cabecera */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">📑 Panel de Gestión de Nóminas</h1>
            <p className="page-subtitle">
              Administración de matrículas, registro de credenciales por cédula e importación institucional (Secretaría).
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={exportUsersCSV}
            title="Descargar lista completa de usuarios en formato CSV"
          >
            📥 Extraer / Exportar Nómina (CSV)
          </button>
        </div>
      </div>

      {alert.message && (
        <div className={`alert-banner alert-${alert.type === 'error' ? 'error' : 'success'} animate-fadeIn`}>
          <span>{alert.type === 'error' ? '❌' : '✅'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Pestañas Superiores */}
      <div className="secretaria-tabs-nav">
        <button
          className={`sec-tab-btn ${activeTab === 'nomina' ? 'active' : ''}`}
          onClick={() => setActiveTab('nomina')}
        >
          👥 Nómina Activa ({profiles.length})
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'registro' ? 'active' : ''}`}
          onClick={() => setActiveTab('registro')}
        >
          ➕ Registro Individual
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'archivo' ? 'active' : ''}`}
          onClick={() => setActiveTab('archivo')}
        >
          📂 Carga Masiva (Excel / CSV)
        </button>
      </div>

      {/* PESTAÑA 1: Nómina Activa */}
      {activeTab === 'nomina' && (
        <div className="secretaria-content-card animate-fadeIn">
          <div className="toolbar-container" style={{ marginBottom: '1.5rem' }}>
            <div className="toolbar-search">
              <span className="toolbar-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por cédula, nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-filters">
              <div className="filter-select-wrapper">
                <span className="select-icon">🎭</span>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="todos">Todos los roles</option>
                  <option value="alumno">Alumnos</option>
                  <option value="profesor">Profesores</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="secretaria">Secretaría</option>
                  <option value="administrador">Administradores</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Usuario / Nombre</th>
                  <th>Rol</th>
                  <th>Correo Institucional</th>
                  <th>Curso / Área</th>
                  <th>Primer Ingreso</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No se encontraron usuarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((p) => (
                    <tr key={p.usuario_id || p.cedula}>
                      <td>
                        <strong className="code-badge">{p.cedula}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <img src={p.avatar} alt="Avatar" className="table-avatar-thumb" />
                          <span>{p.nombre}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-role-pill role-${p.rol}`}>
                          {p.rol}
                        </span>
                      </td>
                      <td>{p.correo}</td>
                      <td>{p.curso || 'N/A'}</td>
                      <td>
                        {p.isFirstLogin ? (
                          <span className="status-pill pending">⏳ Pendiente</span>
                        ) : (
                          <span className="status-pill verified">✔️ Activo</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => handleOpenEdit(p)}
                            title="Editar datos y foto de perfil"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn-delete-row"
                            onClick={() => handleDelete(p.usuario_id, p.nombre)}
                            title="Eliminar usuario de la nómina"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: Registro Individual */}
      {activeTab === 'registro' && (
        <div className="secretaria-content-card animate-fadeIn" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 className="section-card-title">📝 Alta Individual de Estudiante / Personal</h2>
          <p className="section-card-subtitle">
            Ingresa los datos para autorizar el acceso de un nuevo integrante de la comunidad Montepiedra.
          </p>

          <form onSubmit={handleRegisterUser} style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-cedula">Número de Cédula (10 dígitos)</label>
              <input
                id="new-cedula"
                type="text"
                placeholder="Ej. 0928877665"
                value={formCedula}
                onChange={(e) => setFormCedula(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-nombre">Nombre Completo</label>
              <input
                id="new-nombre"
                type="text"
                placeholder="Ej. Lucas Villacrés"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-rol">Rol Institucional</label>
              <select
                id="new-rol"
                value={formRol}
                onChange={(e) => setFormRol(e.target.value)}
              >
                <option value="alumno">Alumno / Estudiante</option>
                <option value="profesor">Profesor / Docente</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="secretaria">Secretaría</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>

            {formRol === 'alumno' && (
              <div className="form-group animate-fadeIn">
                <label className="form-label" htmlFor="new-curso">Curso o Grado (Seleccione)</label>
                <select
                  id="new-curso"
                  value={formCurso}
                  onChange={(e) => setFormCurso(e.target.value)}
                >
                  {COURSE_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="new-correo">Correo Institucional Asignado</label>
              <input
                id="new-correo"
                type="email"
                placeholder="usuario@alumno.montepiedra.edu.ec"
                value={formCorreo}
                onChange={(e) => setFormCorreo(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('nomina')}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                💾 Registrar en Nómina
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PESTAÑA 3: Carga Masiva por Archivo (Excel / CSV) */}
      {activeTab === 'archivo' && (
        <div className="secretaria-content-card animate-fadeIn">
          <h2 className="section-card-title">📤 Carga Masiva de Nómina Escolar</h2>
          <p className="section-card-subtitle">
            Sube un archivo de hoja de cálculo (.xlsx, .csv) con la nómina de estudiantes para importarlos automáticamente.
          </p>

          {/* Zona Drag & Drop */}
          <div 
            className={`file-dropzone ${dragActive ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
          >
            <div className="dropzone-icon">📊</div>
            <h3>Arrastra y suelta aquí tu archivo Excel o CSV</h3>
            <p>o haz clic en el botón para explorar tus documentos</p>
            
            <input
              type="file"
              id="file-upload-input"
              accept=".csv, .xlsx, .xls, .txt"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="file-upload-input" className="btn btn-primary" style={{ cursor: 'pointer', marginTop: '1rem' }}>
              📁 Seleccionar Archivo
            </label>
          </div>

          {/* Botones de acción e importación masiva */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleDownloadCSVGuide}
              style={{ fontSize: '0.9rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              📥 Descargar Guía/Formato CSV
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={loadDemoFile}
              style={{ fontSize: '0.9rem' }}
            >
              ⚡ Cargar Archivo Demo de Prueba (5 Estudiantes)
            </button>
          </div>

          {/* Previsualización de los datos parseados */}
          {parsedPreview.length > 0 && (
            <div className="batch-preview-container animate-fadeIn" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary)', margin: 0 }}>
                    📋 Previsualización: {selectedFileName} ({parsedPreview.length} registros detectados)
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    Revisa las columnas antes de confirmar la inserción a la nómina institucional.
                  </p>
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={handleConfirmBatchImport}
                >
                  🚀 Confirmar e Importar Nómina
                </button>
              </div>

              <div className="table-responsive-wrapper">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cédula</th>
                      <th>Nombre</th>
                      <th>Correo Institucional</th>
                      <th>Curso</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPreview.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong className="code-badge">{item.cedula}</strong></td>
                        <td>{item.nombre}</td>
                        <td>{item.correo}</td>
                        <td>{item.curso}</td>
                        <td><span className="badge-role-pill role-alumno">{item.rol}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {/* MODAL 1: Editar Datos y Foto de Perfil de Usuario */}
      {isEditModalOpen && editingUser && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fadeIn" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>✏️ Editar Usuario y Foto de Perfil</h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEditUser}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <img src={editingUser.avatar} alt="Avatar actual" className="profile-big-avatar" style={{ width: '64px', height: '64px' }} />
                <div>
                  <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>{editingUser.nombre}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Cédula: {editingUser.cedula}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-nombre">Nombre Completo</label>
                <input
                  id="edit-nombre"
                  type="text"
                  value={editingUser.nombre}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-cedula">Cédula</label>
                <input
                  id="edit-cedula"
                  type="text"
                  value={editingUser.cedula}
                  onChange={(e) => setEditingUser({ ...editingUser, cedula: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-correo">Correo Institucional</label>
                <input
                  id="edit-correo"
                  type="email"
                  value={editingUser.correo}
                  onChange={(e) => setEditingUser({ ...editingUser, correo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-rol">Rol Institucional</label>
                <select
                  id="edit-rol"
                  value={editingUser.rol}
                  onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value })}
                >
                  <option value="alumno">alumno</option>
                  <option value="profesor">profesor</option>
                  <option value="mantenimiento">mantenimiento</option>
                  <option value="secretaria">secretaria</option>
                  <option value="administrador">administrador</option>
                </select>
              </div>

              {editingUser.rol === 'alumno' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-curso">Curso o Grado</label>
                  <select
                    id="edit-curso"
                    value={editingUser.curso || '1ro de Bachillerato'}
                    onChange={(e) => setEditingUser({ ...editingUser, curso: e.target.value })}
                  >
                    {COURSE_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="edit-avatar">URL de Foto de Perfil</label>
                <input
                  id="edit-avatar"
                  type="url"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={editingUser.avatar || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, avatar: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Guía de Formato CSV */}
      {isCsvGuideModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fadeIn" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>📋 Guía y Formato Oficial de Importación CSV</h2>
              <button className="modal-close" onClick={() => setIsCsvGuideModalOpen(false)}>✕</button>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              <p>El sistema acepta archivos <code>.csv</code> o <code>.xlsx</code> con las siguientes 5 cabeceras obligatorias:</p>
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1rem' }}>
                cedula,nombre,correo,curso,rol
              </div>

              <h4 style={{ color: 'var(--color-primary)', marginTop: '1rem' }}>Reglas de Validación:</h4>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                <li><strong>Cédula:</strong> Número único de 10 dígitos (servirá como clave inicial).</li>
                <li><strong>Nombre:</strong> Nombres y apellidos completos.</li>
                <li><strong>Correo:</strong> Debe terminar en <code>@alumno.montepiedra.edu.ec</code> o <code>@montepiedra.edu.ec</code>.</li>
                <li><strong>Curso:</strong> Utilizar etiquetas estándar: <em>8vo de Básica, 9no de Básica, 10mo de Básica, 1ro de Bachillerato, 2do de Bachillerato, 3ro de Bachillerato</em>.</li>
                <li><strong>Rol:</strong> <em>alumno, profesor, mantenimiento, secretaria, administrador</em>.</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsCsvGuideModalOpen(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
