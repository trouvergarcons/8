import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'contacts.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Avatar gradient palettes for contact cards
const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-fuchsia-600',
  'from-sky-500 to-indigo-500'
];

function getRandomGradient() {
  return AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
}

// Persistence helpers
async function readContacts() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

async function writeContacts(contacts) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
}

// Validation helper
function validateContactPayload(body, isUpdate = false) {
  const errors = [];
  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();

  if (!isUpdate && !firstName && !lastName) {
    errors.push('Either first name or last name is required.');
  }

  if (body.email && typeof body.email === 'string' && body.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      errors.push('Please enter a valid email address.');
    }
  }

  return errors;
}

// ---------------- API ROUTES ----------------

// GET /api/contacts/stats
app.get('/api/contacts/stats', async (req, res) => {
  try {
    const contacts = await readContacts();
    const total = contacts.length;
    const favorites = contacts.filter(c => c.favorite).length;
    const categories = contacts.reduce((acc, c) => {
      const cat = c.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    res.json({ total, favorites, categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
});

// GET /api/contacts - List with query search, filtering, and sorting
app.get('/api/contacts', async (req, res) => {
  try {
    let contacts = await readContacts();
    const { q, category, favorite, sort } = req.query;

    // Search query
    if (q && typeof q === 'string' && q.trim()) {
      const search = q.trim().toLowerCase();
      contacts = contacts.filter(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const company = (c.company || '').toLowerCase();
        const jobTitle = (c.jobTitle || '').toLowerCase();
        const notes = (c.notes || '').toLowerCase();
        return fullName.includes(search) ||
               email.includes(search) ||
               phone.includes(search) ||
               company.includes(search) ||
               jobTitle.includes(search) ||
               notes.includes(search);
      });
    }

    // Category filter
    if (category && category !== 'All') {
      contacts = contacts.filter(c => (c.category || 'Other').toLowerCase() === category.toLowerCase());
    }

    // Favorite filter
    if (favorite === 'true') {
      contacts = contacts.filter(c => Boolean(c.favorite));
    }

    // Sorting
    contacts.sort((a, b) => {
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();

      switch (sort) {
        case 'name_desc':
          return nameB.localeCompare(nameA);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'name_asc':
        default:
          return nameA.localeCompare(nameB);
      }
    });

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve contacts.' });
  }
});

// GET /api/contacts/:id - Retrieve single contact
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contacts = await readContacts();
    const contact = contacts.find(c => c.id === req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve contact.' });
  }
});

// POST /api/contacts - Create contact
app.post('/api/contacts', async (req, res) => {
  try {
    const validationErrors = validateContactPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const contacts = await readContacts();
    const now = new Date().toISOString();

    const newContact = {
      id: 'c-' + randomUUID().slice(0, 8),
      firstName: (req.body.firstName || '').trim(),
      lastName: (req.body.lastName || '').trim(),
      email: (req.body.email || '').trim(),
      phone: (req.body.phone || '').trim(),
      company: (req.body.company || '').trim(),
      jobTitle: (req.body.jobTitle || '').trim(),
      category: req.body.category || 'Other',
      favorite: Boolean(req.body.favorite),
      notes: (req.body.notes || '').trim(),
      avatarColor: req.body.avatarColor || getRandomGradient(),
      createdAt: now,
      updatedAt: now
    };

    contacts.unshift(newContact);
    await writeContacts(contacts);

    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create contact.' });
  }
});

// PUT /api/contacts/:id - Update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const contacts = await readContacts();
    const index = contacts.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    const validationErrors = validateContactPayload(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const existing = contacts[index];
    const updated = {
      ...existing,
      firstName: req.body.firstName !== undefined ? req.body.firstName.trim() : existing.firstName,
      lastName: req.body.lastName !== undefined ? req.body.lastName.trim() : existing.lastName,
      email: req.body.email !== undefined ? req.body.email.trim() : existing.email,
      phone: req.body.phone !== undefined ? req.body.phone.trim() : existing.phone,
      company: req.body.company !== undefined ? req.body.company.trim() : existing.company,
      jobTitle: req.body.jobTitle !== undefined ? req.body.jobTitle.trim() : existing.jobTitle,
      category: req.body.category !== undefined ? req.body.category : existing.category,
      favorite: req.body.favorite !== undefined ? Boolean(req.body.favorite) : existing.favorite,
      notes: req.body.notes !== undefined ? req.body.notes.trim() : existing.notes,
      avatarColor: req.body.avatarColor || existing.avatarColor || getRandomGradient(),
      updatedAt: new Date().toISOString()
    };

    contacts[index] = updated;
    await writeContacts(contacts);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact.' });
  }
});

// PATCH /api/contacts/:id/favorite - Toggle favorite
app.patch('/api/contacts/:id/favorite', async (req, res) => {
  try {
    const contacts = await readContacts();
    const contact = contacts.find(c => c.id === req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    contact.favorite = !contact.favorite;
    contact.updatedAt = new Date().toISOString();
    await writeContacts(contacts);

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favorite.' });
  }
});

// DELETE /api/contacts/:id - Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contacts = await readContacts();
    const index = contacts.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    const removed = contacts.splice(index, 1)[0];
    await writeContacts(contacts);

    res.json({ message: 'Contact deleted successfully.', contact: removed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
});

// GET /api/contacts/export/csv - Export CSV
app.get('/api/contacts/export/csv', async (req, res) => {
  try {
    const contacts = await readContacts();
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Category', 'Favorite', 'Notes', 'Created At'];
    
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const escaped = String(str).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = contacts.map(c => [
      escapeCsv(c.id),
      escapeCsv(c.firstName),
      escapeCsv(c.lastName),
      escapeCsv(c.email),
      escapeCsv(c.phone),
      escapeCsv(c.company),
      escapeCsv(c.jobTitle),
      escapeCsv(c.category),
      escapeCsv(c.favorite ? 'Yes' : 'No'),
      escapeCsv(c.notes),
      escapeCsv(c.createdAt)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts_export.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

// POST /api/contacts/import - Import contacts JSON
app.post('/api/contacts/import', async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Request body must be an array of contacts.' });
    }

    const contacts = await readContacts();
    let importedCount = 0;
    const now = new Date().toISOString();

    for (const item of items) {
      if (!item.firstName && !item.lastName) continue;

      const newContact = {
        id: 'c-' + randomUUID().slice(0, 8),
        firstName: (item.firstName || '').trim(),
        lastName: (item.lastName || '').trim(),
        email: (item.email || '').trim(),
        phone: (item.phone || '').trim(),
        company: (item.company || '').trim(),
        jobTitle: (item.jobTitle || '').trim(),
        category: item.category || 'Other',
        favorite: Boolean(item.favorite),
        notes: (item.notes || '').trim(),
        avatarColor: getRandomGradient(),
        createdAt: now,
        updatedAt: now
      };

      contacts.unshift(newContact);
      importedCount++;
    }

    await writeContacts(contacts);
    res.json({ message: `Successfully imported ${importedCount} contact(s).`, count: importedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import contacts.' });
  }
});

// Serve SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server if run directly
const isMain = process.argv[1] && (path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)));
if (isMain) {
  app.listen(PORT, () => {
    console.log(`🚀 Contact Management Application is running at http://localhost:${PORT}`);
  });
}

export default app;
