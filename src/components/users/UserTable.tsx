import { useState } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import type { UserRole } from "../../types/auth";

type Props = {
  refresh: (message: string) => void;
};

export default function UserTable({ refresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [carnet, setCarnet] = useState("");
  const [role, setRole] = useState<UserRole>("ESTUDIANTE");
  const [school, setSchool] = useState("");
  const [course, setCourse] = useState("");
  const [password, setPassword] = useState("");

  const users = financeRepository.getUsers();

  const startEditing = (user: (typeof users)[number]) => {
    setEditingId(user.id);
    setName(user.name);
    setCarnet(user.carnet);
    setRole(user.role);
    setSchool(user.school ?? "");
    setCourse(user.course ?? "");
    setPassword("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setPassword("");
  };

  const saveChanges = (userId: string) => {
    const cleanName = name.trim();
    const cleanCarnet = carnet.trim();

    if (!cleanName || !cleanCarnet) {
      refresh("El nombre y el carnet son obligatorios.");
      return;
    }

    const duplicateCarnet = financeRepository
      .getUsers()
      .some(
        (user) =>
          user.id !== userId && user.carnet.trim() === cleanCarnet,
      );

    if (duplicateCarnet) {
      refresh("Ya existe un usuario con ese carnet.");
      return;
    }

    const updatedUser = financeRepository.updateUser(userId, {
      name: cleanName,
      carnet: cleanCarnet,
      role,
      school: role === "ESTUDIANTE" ? school.trim() : undefined,
      course: role === "ESTUDIANTE" ? course.trim() : undefined,
      ...(password.trim() ? { password: password.trim() } : {}),
    });

    if (!updatedUser) {
      refresh("No se encontró el usuario.");
      return;
    }

    setEditingId(null);
    setPassword("");
    refresh("Usuario actualizado correctamente.");
  };

  const removeUser = (userId: string) => {
    const confirmed = window.confirm(
      "¿Quieres eliminar este usuario? La acción no se puede deshacer.",
    );

    if (!confirmed) return;

    const deleted = financeRepository.deleteUser(userId);

    refresh(
      deleted
        ? "Usuario eliminado correctamente."
        : "No se puede eliminar: el usuario tiene pagos o multas asociados.",
    );
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
              const canManage =
                user.role === "ESTUDIANTE" || user.role === "TESORERO";

              return (
                <tr key={user.id}>
                  <td>
                    {isEditing ? (
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Nombre completo"
                      />
                    ) : (
                      <strong>{user.name}</strong>
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        value={carnet}
                        onChange={(event) => setCarnet(event.target.value)}
                        placeholder="Carnet"
                      />
                    ) : (
                      user.carnet
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <select
                        value={role}
                        onChange={(event) =>
                          setRole(event.target.value as UserRole)
                        }
                      >
                        <option value="ESTUDIANTE">Estudiante</option>
                        <option value="TESORERO">Tesorero</option>
                      </select>
                    ) : (
                      <b className="tag neutral">
                        {financeRepository.roleLabel(user.role)}
                      </b>
                    )}
                  </td>

                  <td>
                    {isEditing && role === "ESTUDIANTE" ? (
                      <input
                        value={school}
                        onChange={(event) => setSchool(event.target.value)}
                        placeholder="Escuela"
                      />
                    ) : user.role === "ESTUDIANTE" && !isEditing ? (
                      user.school || "—"
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {isEditing && role === "ESTUDIANTE" ? (
                      <input
                        value={course}
                        onChange={(event) => setCourse(event.target.value)}
                        placeholder="Curso"
                      />
                    ) : user.role === "ESTUDIANTE" && !isEditing ? (
                      user.course || "—"
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <>
                        <input
                          type="password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Nueva contraseña (opcional)"
                        />

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
                    ) : canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(user)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => removeUser(user.id)}
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      "—"
                    )}
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