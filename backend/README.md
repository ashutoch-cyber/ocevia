# NEER Backend (Django + DRF)

This backend is separated from the React frontend and exposes REST APIs for NEER.

## Tech Stack

- Django
- Django REST Framework
- django-cors-headers

## Run Backend

```bash
cd backend
C:/Users/mrash/AppData/Local/Programs/Python/Python314/python.exe manage.py migrate
C:/Users/mrash/AppData/Local/Programs/Python/Python314/python.exe manage.py runserver
```

Backend base URL:

`http://127.0.0.1:8000`

## API Endpoints

- `GET /api/search/?query=`
- `GET /api/risk/`
- `GET /api/alerts/`
- `GET /api/insights/`
- `GET /api/data-sources/`

## React Fetch Snippets

### 1) Search

```js
fetch("http://127.0.0.1:8000/api/search/?query=puri")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### 2) Coastal Risk Map

```js
fetch("http://127.0.0.1:8000/api/risk/")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### 3) Alerts

```js
fetch("http://127.0.0.1:8000/api/alerts/")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### 4) Insights

```js
fetch("http://127.0.0.1:8000/api/insights/")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### 5) Data Sources

```js
fetch("http://127.0.0.1:8000/api/data-sources/")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

## Notes for Future ML/API Integration

- `api/services.py` centralizes data retrieval so mock data can be replaced with NOAA/Copernicus connectors.
- API views are thin and serializer-driven, making it easy to inject model inference layers later.
- Basic models are added to support persistence and future production scaling.