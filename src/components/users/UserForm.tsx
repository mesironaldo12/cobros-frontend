import type { FormEvent } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import type { UserRole } from "../../types/auth";

type Props = {
  refresh: (message: string) => void;
};

export default function UserForm({ refresh }: Props) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    financeRepository.addUser({
      name: String(data.get("name")),
      carnet: String(data.get("carnet")),
      password: String(data.get("password")),
      role: String(data.get("role")) as UserRole,
    });

    form.reset();
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
            <select name="role" defaultValue="ESTUDIANTE">
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

        <button className="primary" type="submit">
          Añadir usuario
        </button>
      </form>
    </section>
  );
}
