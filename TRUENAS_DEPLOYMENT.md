# TrueNAS Docker Deployment - Protocol Web

Deploy the Protocol Department Visitor Management app on TrueNAS using Docker.

## TrueNAS Application Configuration

### Application Name
```
protocol-web
```

### Image Configuration
| Setting | Value |
|---------|-------|
| Repository | `ghcr.io/joseyapor21/protocol-web` |
| Tag | `latest` |
| Pull Policy | Always pull an image even if it is present on the host |

### Environment Variables

| Name | Value | Description |
|------|-------|-------------|
| `MONGODB_URI` | `mongodb://Joseyapor21:J7249656y@192.168.8.254:27017/emergency?authSource=admin` | MongoDB connection string |
| `JWT_SECRET` | `protocol-department-jwt-secret-key` | Secret for JWT tokens |
| `NEXT_PUBLIC_APP_URL` | `http://192.168.8.254:3001` | Public URL of the app (update IP/port as needed) |
| `CLOUDINARY_CLOUD_NAME` | `dhorabvdt` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `915813662291995` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `ZQ4NntCZn7IwQ1M00R21mxBJJAc` | Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dhorabvdt` | Public Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `visitor_photos` | Cloudinary upload preset |

### Container Configuration
| Setting | Value |
|---------|-------|
| Restart Policy | Unless Stopped |
| TTY | Disabled |
| Stdin | Disabled |

### Network Configuration
| Setting | Value |
|---------|-------|
| Host Network | Disabled |

#### Ports
| Host Port | Container Port | Protocol |
|-----------|----------------|----------|
| 3001 | 3000 | TCP |

### Security Context Configuration
| Setting | Value |
|---------|-------|
| Privileged | Disabled |
| Custom User | Disabled |

### Storage Configuration
No persistent storage required (data is stored in MongoDB).

### Resources Configuration
| Setting | Value |
|---------|-------|
| Enable Resource Limits | Optional |

---

## Quick Setup Steps

1. **Create GitHub Repository**
   - Create a new repository: `protocol-web`
   - Push the code to GitHub

2. **Enable GitHub Container Registry**
   - The workflow will automatically publish to `ghcr.io/joseyapor21/protocol-web`
   - Make sure to set the package visibility to public (or configure authentication)

3. **Create TrueNAS App**
   - Go to Apps > Discover Apps > Custom App
   - Fill in the configuration as shown above
   - Click Install

4. **Verify Deployment**
   - Access the app at `http://<truenas-ip>:3001`
   - Login with your Protocol Department credentials

---

## Environment Variables Quick Copy

```bash
MONGODB_URI=mongodb://Joseyapor21:J7249656y@192.168.8.254:27017/emergency?authSource=admin
JWT_SECRET=protocol-department-jwt-secret-key
NEXT_PUBLIC_APP_URL=http://192.168.8.254:3001
CLOUDINARY_CLOUD_NAME=dhorabvdt
CLOUDINARY_API_KEY=915813662291995
CLOUDINARY_API_SECRET=ZQ4NntCZn7IwQ1M00R21mxBJJAc
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhorabvdt
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=visitor_photos
```

---

## Updating the App

When you push changes to the `main` branch:
1. GitHub Actions will automatically build and push a new Docker image
2. In TrueNAS, go to Apps > protocol-web > Edit
3. Click "Save" to pull the latest image (if Pull Policy is set to "Always")

Or manually restart the app to pull the latest image.
