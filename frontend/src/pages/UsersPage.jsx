import { useState, useEffect } from "react";
import apiClient from "../api/client";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    apiClient.get("/users").then(({ data }) => setUsers(data));
  }, []);

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ first_name: user.first_name, last_name: user.last_name, role: user.role });
  };

  const saveEdit = async (id) => {
    const { data } = await apiClient.put(`/users/${id}`, editForm);
    setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
    setEditingId(null);
  };

  const blockUser = async (id) => {
    if (!confirm("Заблокировать пользователя?")) return;
    await apiClient.delete(`/users/${id}`);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, blocked: true } : u))
    );
  };

  return (
    <div>
      <h2>Пользователи</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.blocked ? "row-blocked" : ""}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>
                  {editingId === u.id ? (
                    <input
                      value={editForm.first_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, first_name: e.target.value })
                      }
                    />
                  ) : (
                    u.first_name
                  )}
                </td>
                <td>
                  {editingId === u.id ? (
                    <input
                      value={editForm.last_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, last_name: e.target.value })
                      }
                    />
                  ) : (
                    u.last_name
                  )}
                </td>
                <td>
                  {editingId === u.id ? (
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value })
                      }
                    >
                      <option value="user">user</option>
                      <option value="seller">seller</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                  )}
                </td>
                <td>
                  <span className={u.blocked ? "status-blocked" : "status-active"}>
                    {u.blocked ? "Заблокирован" : "Активен"}
                  </span>
                </td>
                <td className="actions-cell">
                  {editingId === u.id ? (
                    <>
                      <button onClick={() => saveEdit(u.id)} className="btn-sm">
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-sm btn-ghost"
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(u)} className="btn-sm">
                        Изменить
                      </button>
                      {!u.blocked && (
                        <button
                          onClick={() => blockUser(u.id)}
                          className="btn-sm btn-danger"
                        >
                          Блок
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
