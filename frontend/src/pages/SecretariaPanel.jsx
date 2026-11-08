import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateEcuadorianCedula, formatRole } from '../utils/api';
import {
  FileSpreadsheet,
  Download,
  Users,
  UserPlus,
  FolderUp,
  Search,
  UserCheck,
  GraduationCap,
  Clock,
  CheckCircle2,
  Edit3,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  Save,
  FolderOpen,
  CheckSquare,
  UploadCloud,
  X,
  FileText
} from 'lucide-react';
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
  const { user, profiles, addUser, editUser, importUsersBatch, deleteUser, exportUsersCSV } = useAuth();

  const isSecretaria = user?.rol === 'secretaria' || user?.rol === 'secretaría';

  // Estados de pestañas y búsqueda
  const [activeTab, setActiveTab] = useState('nomina'); // 'nomina', 'registro', 'archivo'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [filterCourse, setFilterCourse] = useState('todos');

  // Formulario individual
  const [formCedula, setFormCedula] = useState('');
  const [formCedulaError, setFormCedulaError] = useState('');
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
  const [editCedulaError, setEditCedulaError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Mensajes de alerta
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 5000);
  };

  // Manejador de Cédula en Formulario de Alta
  const handleFormCedulaChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setFormCedula(clean);
    if (clean.length > 0) {
      const validation = validateEcuadorianCedula(clean);
      setFormCedulaError(validation.isValid ? '' : validation.message);
    } else {
      setFormCedulaError('');
    }
  };

  // Manejador de Cédula en Modal de Edición
  const handleEditCedulaChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setEditingUser(prev => prev ? ({ ...prev, cedula: clean }) : null);
    if (clean.length > 0) {
      const validation = validateEcuadorianCedula(clean);
      setEditCedulaError(validation.isValid ? '' : validation.message);
    } else {
      setEditCedulaError('');
    }
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

  // Manejo de eliminación de usuario con validación de backend
  const handleDelete = async (usuario_id, nombre) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar a "${nombre}" de la nómina?`)) {
      return;
    }
    const result = await deleteUser(usuario_id);
    if (result && result.success) {
      showAlert('success', `El usuario ${nombre} ha sido eliminado correctamente.`);
    } else {
      showAlert('error', result?.error || 'No se pudo eliminar el usuario en el backend.');
    }
  };

  // 1. Registro Individual
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!formCedula || !formNombre || !formCorreo) return;

    const validation = validateEcuadorianCedula(formCedula);
    if (!validation.isValid) {
      setFormCedulaError(validation.message);
      showAlert('error', validation.message);
      return;
    }

    if (isSecretaria && (formRol === 'administrador' || formRol === 'admin')) {
      showAlert('error', 'El rol Secretaría no tiene permisos para crear usuarios Administradores.');
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
      showAlert('success', `Estudiante/Usuario ${formNombre} registrado exitosamente en la nómina.`);
      setFormCedula('');
      setFormCedulaError('');
      setFormNombre('');
      setFormCorreo('');
      setFormCurso('1ro de Bachillerato');
      setActiveTab('nomina');
    } else {
      showAlert('error', result.error || 'Error al registrar el usuario.');
    }
  };

  // 2. Procesamiento y Parseo de Archivo (CSV / Excel)
  const handleFileUpload = (file) => {
    if (!file) return;
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      
      const parsed = [];
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
        setParsedPreview([]);
        showAlert('error', 'El archivo cargado no contiene registros válidos o está vacío. Por favor revisa el formato CSV.');
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

    const validation = validateEcuadorianCedula(editingUser.cedula);
    if (!validation.isValid) {
      setEditCedulaError(validation.message);
      showAlert('error', validation.message);
      return;
    }

    if (isSecretaria && (editingUser.rol === 'administrador' || editingUser.rol === 'admin')) {
      showAlert('error', 'El rol Secretaría no puede asignar el rol de Administrador.');
      return;
    }

    const result = await editUser(editingUser.usuario_id, editingUser);
    if (result.success) {
      showAlert('success', `Datos de ${editingUser.nombre} actualizados correctamente en la nómina.`);
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditCedulaError('');
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

  // Filtro de Usuarios en Tabla (Búsqueda por texto + Rol + Curso o Grado)
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = 
      (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cedula || '').includes(searchTerm) ||
      (p.correo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'todos' || p.rol === filterRole;
    const matchesCourse = filterCourse === 'todos' || (p.curso || '').toLowerCase() === filterCourse.toLowerCase();

    return matchesSearch && matchesRole && matchesCourse;
  });

  return (
    <div className="container">
      {/* Cabecera */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileSpreadsheet size={28} /> Panel de Gestión de Nóminas
            </h1>
            <p className="page-subtitle">
              Administración de matrículas, credenciales por cédula, filtrado escolar e importación de datos (Secretaría).
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={exportUsersCSV}
            title="Descargar lista completa de usuarios en formato CSV"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={15} /> Extraer / Exportar Nómina (CSV)
          </button>
        </div>
      </div>

      {alert.message && (
        <div className={`alert-banner alert-${alert.type === 'error' ? 'error' : 'success'} animate-fadeIn`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{alert.type === 'error' ? <AlertOctagon size={18} /> : <CheckCircle2 size={18} />}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Pestañas Superiores */}
      <div className="secretaria-tabs-nav">
        <button
          className={`sec-tab-btn ${activeTab === 'nomina' ? 'active' : ''}`}
          onClick={() => setActiveTab('nomina')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Users size={16} /> Nómina Activa ({profiles.length})
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'registro' ? 'active' : ''}`}
          onClick={() => setActiveTab('registro')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <UserPlus size={16} /> Registro Individual
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'archivo' ? 'active' : ''}`}
          onClick={() => setActiveTab('archivo')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FolderUp size={16} /> Carga Masiva (Excel / CSV)
        </button>
      </div>

      {/* PESTAÑA 1: Nómina Activa */}
      {activeTab === 'nomina' && (
        <div className="secretaria-content-card animate-fadeIn">
          <div className="toolbar-container" style={{ marginBottom: '1.5rem' }}>
            <div className="toolbar-search">
              <span className="toolbar-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por cédula, nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-filters">
              {/* Filtro por Rol */}
              <div className="filter-select-wrapper">
                <span className="select-icon">
                  <UserCheck size={15} />
                </span>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  title="Filtrar por rol institucional"
                >
                  <option value="todos">Todos los roles</option>
                  <option value="alumno">Alumnos</option>
                  <option value="profesor">Profesores</option>
                  <option value="secretaria">Secretaría</option>
                  <option value="administrador">Administradores</option>
                </select>
              </div>

              {/* Filtro por Cursos o Grados Escolares */}
              <div className="filter-select-wrapper">
                <span className="select-icon">
                  <GraduationCap size={15} />
                </span>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  title="Segmentar y buscar estudiantes por curso o grado"
                >
                  <option value="todos">Todos los cursos / grados</option>
                  {COURSE_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
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
                  <th>Curso / Grado</th>
                  <th>Primer Ingreso</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No se encontraron usuarios que coincidan con los filtros seleccionados.
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
                          {formatRole(p.rol)}
                        </span>
                      </td>
                      <td>{p.correo}</td>
                      <td>{p.curso || 'N/A'}</td>
                      <td>
                        {p.isFirstLogin ? (
                          <span className="status-pill pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> Pendiente
                          </span>
                        ) : (
                          <span className="status-pill verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={12} /> Activo
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.65rem', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => handleOpenEdit(p)}
                            title="Editar datos y foto de perfil"
                          >
                            <Edit3 size={14} />
                            <span>Editar</span>
                          </button>
                          <button
                            className="btn-delete-row"
                            onClick={() => handleDelete(p.usuario_id, p.nombre)}
                            title="Eliminar usuario de la nómina"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.35rem 0.55rem' }}
                          >
                            <Trash2 size={14} />
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
          <h2 className="section-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={22} /> Alta Individual de Estudiante / Personal
          </h2>
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
                onChange={(e) => handleFormCedulaChange(e.target.value)}
                maxLength={10}
                required
                className={formCedulaError ? 'input-invalid' : ''}
              />
              {formCedulaError && (
                <p className="input-error-msg" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertTriangle size={13} /> {formCedulaError}
                </p>
              )}
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
                <option value="secretaria">Secretaría</option>
                {!isSecretaria && <option value="administrador">Administrador</option>}
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
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={Boolean(formCedulaError) || !formCedula}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={15} /> Registrar en Nómina
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PESTAÑA 3: Carga Masiva por Archivo (Excel / CSV) Reorganizada */}
      {activeTab === 'archivo' && (
        <div className="secretaria-content-card animate-fadeIn">
          <h2 className="section-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderUp size={22} /> Carga Masiva de Nómina Escolar
          </h2>
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
            <div className="dropzone-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <FileSpreadsheet size={44} style={{ color: 'var(--color-primary)' }} />
            </div>
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
            <label htmlFor="file-upload-input" className="btn btn-primary" style={{ cursor: 'pointer', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <FolderOpen size={16} /> Seleccionar Archivo
            </label>
          </div>

          {/* Botones de acción reorganizados (Eliminado botón demo, integrado extraer/exportar nómina activa) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleDownloadCSVGuide}
              style={{ fontSize: '0.9rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FileSpreadsheet size={16} />
              <span>Descargar Plantilla / Formato CSV</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={exportUsersCSV}
              style={{ fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              title="Descargar nómina actual completa en formato CSV"
            >
              <Download size={16} />
              <span>Extraer / Exportar Nómina Activa (CSV)</span>
            </button>
          </div>

          {/* Previsualización de los datos parseados */}
          {parsedPreview.length > 0 && (
            <div className="batch-preview-container animate-fadeIn" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckSquare size={18} /> Previsualización: {selectedFileName} ({parsedPreview.length} registros detectados)
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    Revisa las columnas antes de confirmar la inserción a la nómina institucional.
                  </p>
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={handleConfirmBatchImport}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <UploadCloud size={16} /> Confirmar e Importar Nómina
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
                        <td><span className="badge-role-pill role-alumno">{formatRole(item.rol)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Editar Datos de Usuario */}
      {isEditModalOpen && editingUser && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content animate-fadeIn" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} /> Editar Usuario y Perfil
              </h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)} aria-label="Cerrar modal">
                <X size={18} />
              </button>
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
                  onChange={(e) => handleEditCedulaChange(e.target.value)}
                  maxLength={10}
                  required
                  className={editCedulaError ? 'input-invalid' : ''}
                />
                {editCedulaError && (
                  <p className="input-error-msg" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangle size={13} /> {editCedulaError}
                  </p>
                )}
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
                  <option value="alumno">Alumno</option>
                  <option value="profesor">Profesor</option>
                  <option value="secretaria">Secretaria</option>
                  {!isSecretaria && <option value="administrador">Administrador</option>}
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
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={Boolean(editCedulaError) || !editingUser.cedula}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Save size={15} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Guía de Formato CSV */}
      {isCsvGuideModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCsvGuideModalOpen(false)}>
          <div className="modal-content animate-fadeIn" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} /> Guía y Formato Oficial de Importación CSV
              </h2>
              <button className="modal-close" onClick={() => setIsCsvGuideModalOpen(false)} aria-label="Cerrar modal">
                <X size={18} />
              </button>
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
                <li><strong>Rol:</strong> <em>alumno, profesor, secretaria, administrador</em>.</li>
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
