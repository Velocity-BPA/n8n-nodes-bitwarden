# n8n-nodes-bitwarden

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

An n8n community node for integrating with Bitwarden password management and secrets platform. This node provides 7 resources with comprehensive operations for managing organizations, members, groups, collections, events, secrets, and projects through Bitwarden's API.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Bitwarden](https://img.shields.io/badge/Bitwarden-API-175DDC)
![Security](https://img.shields.io/badge/Security-Password%20Manager-green)
![Enterprise](https://img.shields.io/badge/Enterprise-Ready-orange)

## Features

- **Organization Management** - Create, update, and manage Bitwarden organizations with full administrative control
- **Member Administration** - Add, remove, and manage organization members with role-based access control
- **Group Operations** - Create and manage groups for organized access control and permission management
- **Collection Management** - Organize vault items into collections with granular sharing permissions
- **Event Monitoring** - Access comprehensive audit logs and event tracking for compliance and security
- **Secrets Management** - Securely store and retrieve secrets for applications and infrastructure
- **Project Organization** - Create and manage projects to organize secrets and access controls
- **Enterprise Integration** - Full API coverage for enterprise Bitwarden deployments

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-bitwarden`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-bitwarden
```

### Development Installation

```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-bitwarden.git
cd n8n-nodes-bitwarden
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-bitwarden
n8n start
```

## Credentials Setup

| Field | Description | Required |
|-------|-------------|----------|
| API Key | Your Bitwarden organization API key | Yes |
| Organization ID | The ID of your Bitwarden organization | Yes |
| Base URL | Custom Bitwarden server URL (leave empty for bitwarden.com) | No |

## Resources & Operations

### 1. Organization

| Operation | Description |
|-----------|-------------|
| Get | Retrieve organization details and settings |
| Update | Update organization configuration and policies |
| Get Billing | Retrieve billing information and subscription details |
| Update Billing | Update billing settings and payment information |

### 2. Member

| Operation | Description |
|-----------|-------------|
| Get All | List all organization members with their roles and status |
| Get | Retrieve specific member details and permissions |
| Create | Invite new members to the organization |
| Update | Modify member roles and access permissions |
| Delete | Remove members from the organization |
| Reinvite | Resend invitation to pending members |

### 3. Group

| Operation | Description |
|-----------|-------------|
| Get All | List all groups in the organization |
| Get | Retrieve specific group details and member list |
| Create | Create new groups for organizing members |
| Update | Modify group settings and member assignments |
| Delete | Remove groups from the organization |

### 4. Collection

| Operation | Description |
|-----------|-------------|
| Get All | List all collections with access permissions |
| Get | Retrieve specific collection details and items |
| Create | Create new collections for organizing vault items |
| Update | Modify collection settings and permissions |
| Delete | Remove collections and their contents |

### 5. Event

| Operation | Description |
|-----------|-------------|
| Get All | Retrieve organization event logs and audit trail |
| Export | Export events for compliance and backup purposes |

### 6. Secret

| Operation | Description |
|-----------|-------------|
| Get All | List all secrets in specified projects |
| Get | Retrieve specific secret values and metadata |
| Create | Store new secrets with encryption |
| Update | Modify existing secret values and settings |
| Delete | Remove secrets from the vault |

### 7. Project

| Operation | Description |
|-----------|-------------|
| Get All | List all projects in the organization |
| Get | Retrieve specific project details and secrets |
| Create | Create new projects for organizing secrets |
| Update | Modify project settings and access controls |
| Delete | Remove projects and associated secrets |

## Usage Examples

```javascript
// Create a new organization member
{
  "email": "newuser@company.com",
  "type": 2,
  "accessAll": false,
  "collections": [
    {
      "id": "collection-uuid-here",
      "readOnly": false
    }
  ]
}
```

```javascript
// Create a secure secret in a project
{
  "key": "DATABASE_PASSWORD",
  "value": "super-secure-password-123",
  "note": "Production database credentials",
  "projectIds": ["project-uuid-here"]
}
```

```javascript
// Update group with new members
{
  "name": "Development Team",
  "accessAll": false,
  "collections": [
    {
      "id": "dev-collection-uuid",
      "readOnly": false
    }
  ]
}
```

```javascript
// Query organization events for audit
{
  "start": "2024-01-01T00:00:00Z",
  "end": "2024-01-31T23:59:59Z",
  "actingUserId": "user-uuid-here",
  "itemId": "item-uuid-here"
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| 401 Unauthorized | Invalid API key or expired credentials | Verify API key is correct and has not expired |
| 403 Forbidden | Insufficient permissions for the operation | Check user role has required permissions for the resource |
| 404 Not Found | Resource does not exist or access denied | Verify resource ID exists and user has access |
| 429 Too Many Requests | API rate limit exceeded | Implement retry logic with exponential backoff |
| 500 Internal Server Error | Bitwarden server error | Check Bitwarden status page and retry request |
| Network Error | Connection timeout or DNS issues | Verify network connectivity and server URL |

## Development

```bash
npm install
npm run build
npm test
npm run lint
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing style conventions
2. All tests pass (`npm test`)
3. Linting passes (`npm run lint`)
4. Documentation is updated for new features
5. Commit messages are descriptive

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-bitwarden/issues)
- **Bitwarden API Documentation**: [help.bitwarden.com/api](https://bitwarden.com/help/api/)
- **Bitwarden Community**: [community.bitwarden.com](https://community.bitwarden.com/)