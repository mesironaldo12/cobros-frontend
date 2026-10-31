import { useState } from "react";
import { financeRepository } from "../../repositories/financeRepository";

export default function UserTable() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [school, setSchool] = useState("");
  const [course, setCourse] = useState("");

  const users = financeRepository.getUsers();

  const startEditing = (
    userId: string,
    currentSchool: string | undefined,
    currentCourse: string | undefined,
  ) => {
    setEditingId(userId);
    setSchool(currentSchool ?? "");
    setCourse(currentCourse ?? "");
  };

  const saveChanges = (userId: string) => {
    financeRepository.updateUser(userId, {
      school: school.trim(),
      course: course.trim(),
    });

    setEditingId(null);
    setSchool("");
    setCourse("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setSchool("");
    setCourse("");
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Usuarios del sistema</h2>
        <span>{users.length} usuarios</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Carnet</th>
              <th>Rol</th>
              <th>Escuela</th>
              <th>Curso</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isEditing = editingId === user.id;

              return (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                  </td>

                  <td>{user.carnet}</td>

                  <td>
                    <b className="tag neutral">
                      {financeRepository.roleLabel(user.role)}
                    </b>
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        value={school}
                        onChange={(event) => setSchool(event.target.value)}
                        placeholder="Nombre de la escuela"
                      />
                    ) : user.role === "ESTUDIANTE" ? (
                      user.school || "—"
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        value={course}
                        onChange={(event) => setCourse(event.target.value)}
                        placeholder="Ej. 4to A"
                      />
                    ) : user.role === "ESTUDIANTE" ? (
                      user.course || "—"
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {user.role === "ESTUDIANTE" &&
                      (isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveChanges(user.id)}
                          >
                            Guardar
                          </button>

                          <button type="button" onClick={cancelEditing}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(user.id, user.school, user.course)
                          }
                        >
                          Editar
                        </button>
                      ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}