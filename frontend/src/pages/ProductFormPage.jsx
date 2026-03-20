import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import apiClient from "../api/client";

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      apiClient.get(`/products/${id}`).then(({ data }) =>
        setForm({
          title: data.title,
          category: data.category,
          description: data.description,
          price: String(data.price),
        })
      );
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = { ...form, price: Number(form.price) };
    try {
      if (isEdit) {
        await apiClient.put(`/products/${id}`, payload);
      } else {
        await apiClient.post("/products", payload);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка");
    }
  };

  return (
    <div className="form-container">
      <h2>{isEdit ? "Редактировать товар" : "Новый товар"}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Название"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Категория"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />
        <textarea
          placeholder="Описание"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Цена (₽)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          min="0"
          required
        />
        <button type="submit">{isEdit ? "Сохранить" : "Создать"}</button>
      </form>
      <p>
        <Link to="/">← Назад</Link>
      </p>
    </div>
  );
}
