import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const canCreate = user?.role === "seller" || user?.role === "admin";
  const canEdit = user?.role === "seller" || user?.role === "admin";
  const canDelete = user?.role === "admin";

  useEffect(() => {
    apiClient
      .get("/products")
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Удалить товар?")) return;
    await apiClient.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Товары</h2>
        {canCreate && (
          <Link to="/products/new" className="btn">
            + Добавить
          </Link>
        )}
      </div>
      {products.length === 0 ? (
        <p className="empty">Товаров пока нет</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <div key={p.id} className="card">
              <div className="card-category">{p.category}</div>
              <h3>{p.title}</h3>
              <p className="card-desc">{p.description}</p>
              <p className="card-price">{p.price.toLocaleString()} ₽</p>
              <div className="card-actions">
                <Link to={`/products/${p.id}`}>Подробнее</Link>
                {canEdit && (
                  <Link to={`/products/${p.id}/edit`}>Редактировать</Link>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
