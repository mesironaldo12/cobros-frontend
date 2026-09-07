import { financeRepository } from "../../repositories/financeRepository";

export default function UserTable() {
  const users = financeRepository.getUsers();

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
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.carnet}</td>
                <td>
                  <b className="tag neutral">
                    {financeRepository.roleLabel(user.role)}
                  </b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
