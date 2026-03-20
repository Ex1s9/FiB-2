# KR2 — Full-Stack приложение с RBAC и JWT-аутентификацией

Контрольная работа №2 по курсу Frontend и Backend разработки. Реализовано full-stack приложение с JWT-авторизацией, access/refresh токенами и ролевой моделью доступа.

## Стек технологий

**Backend:** Node.js, Express, jsonwebtoken, bcrypt, cors, nodemon

**Frontend:** React 18, Vite, Axios, react-router-dom

## Структура проекта

```
KR2/
├── backend/
│   └── index.js        # Express-сервер, все маршруты и middleware
└── frontend/
    └── src/
        ├── api/        # Axios-клиент с interceptors
        ├── context/    # AuthContext (глобальное состояние)
        ├── components/ # Navbar, ProtectedRoute
        └── pages/      # Login, Register, Products, Users и др.
```

## Функциональность

**Аутентификация:**
- Регистрация и вход с хешированием паролей через bcrypt
- Access-токен с TTL 15 минут, refresh-токен с TTL 7 дней
- Token rotation при обновлении — старый refresh-токен инвалидируется

**Ролевая модель (RBAC):**

| Роль | Продукты | Пользователи |
|------|----------|--------------|
| Guest | — | — |
| User | просмотр | — |
| Seller | просмотр, создание, редактирование | — |
| Admin | полный доступ | полный доступ |

**Управление пользователями (admin only):**
- Просмотр списка пользователей
- Редактирование роли и данных
- Мягкое удаление (блокировка)

## Тестовые аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| admin@test.com | password123 | admin |
| seller@test.com | password123 | seller |
| user@test.com | password123 | user |

## Запуск

**Backend** (порт 3001):
```bash
cd backend
npm install
npm run dev
```

**Frontend** (порт 5173):
```bash
cd frontend
npm install
npm run dev
```
