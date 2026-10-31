import { useState, type FormEvent } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import type { UserRole } from "../../types/auth";

type Props = {
  refresh: (message: string) => void;
};

export default function UserForm({ refresh }: Props) {
  const [role, setRole] = useState<UserRole>("ESTUDIANTE");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    financeRepository.addUser({
      name: String(data.get("name")).trim(),
      carnet: String(data.get("carnet")).trim(),
      password: String(data.get("password")),
      role,
      school:
        role === "ESTUDIANTE" ? String(data.get("school")).trim() : undefined,
      course:
        role === "ESTUDIANTE" ? String(data.get("course")).trim() : undefined,
    });

    form.reset();
    setRole("ESTUDIANTE");
    refresh("Usuario añadido correctamente.");
  };

  return (
    <section className="form-panel compact">
      <div>
        <p className="eyebrow">Administración</p>
        <h2>Añadir usuario</h2>
        <p>Crea una cuenta para un estudiante o tesorero.</p>
      </div>

      <form onSubmit={submit}>
        <div className="form-row">
          <label>
            Nombre completo
            <input name="name" required placeholder="Nombre y apellido" />
          </label>

          <label>
            Carnet
            <input name="carnet" required placeholder="Ej. 20241003" />
          </label>
        </div>

        <div className="form-row">
          <label>
            Rol
            <select
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="TESORERO">Tesorero</option>
            </select>
          </label>

          <label>
            Contraseña
            <input
              name="password"
              type="password"
              required
              minLength={4}
              placeholder="Contraseña temporal"
            />
          </label>
        </div>

        {role === "ESTUDIANTE" && (
          <div className="form-row">
            <label>
              Escuela
              <input name="school" required placeholder="Nombre de la escuela" />
            </label>

            <label>
              Curso
              <input name="course" required placeholder="Ej. 4to A" />
            </label>
          </div>
        )}

        <button className="primary" type="submit">
          Añadir usuario
        </button>
      </form>
    </section>
  );
}