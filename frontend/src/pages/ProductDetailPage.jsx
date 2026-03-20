import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  const canEdit = user?.role === "seller" || user?.role === "admin";
  const canDelete = user?.role === "admin";

  useEffect(() => {
    apiClient.get(`/products/${id}`).then(({ data }) => setProduct(data));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Удалить товар?")) return;
    await apiClient.delete(`/products/${id}`);
    navigate("/");
  };

  if (!product) return <div className="loading">Загрузка...</div>;

  return (
    <div className="detail">
      <div className="detail-category">{product.category}</div>
      <h2>{product.title}</h2>
      <p className="detail-desc">{product.description}</p>
      <p className="detail-price">{product.price.toLocaleString()} ₽</p>
      <div className="detail-actions">
        <Link to="/">← Назад</Link>
        {canEdit && (
          <Link to={`/products/${id}/edit`} className="btn">
            Редактировать
          </Link>
        )}
        {canDelete && (
          <button onClick={handleDelete} className="btn-danger">
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}
