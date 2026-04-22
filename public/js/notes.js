// Base URL for all API requests
// In production, change this to your live domain e.g. 'https://yoursite.com/api'***********************
const API_URL = 'https://assignment4-41x2.onrender.com/api' // dont forget to change this later

// ===== PROTECT THE PAGE =====
// Read the token that was saved to localStorage when the user logged in
const token = localStorage.getItem('token')

// If there is no token, the user is not logged in — send them back to the login page
if (!token) {
  window.location.href = '/'
  throw new Error('No token') // stops the rest of the script from running
}

// ===== AUTH HEADER HELPER =====
// Every request to a protected route must include the JWT token in the Authorization header
// This function returns the headers object so we don't repeat it everywhere
function authHeader() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // format required by our authMiddleware.js
  }
}

// ===== LOGOUT =====
// When logout is clicked, remove the token from localStorage and go back to login
// Without the token, the user can no longer make authenticated requests
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token')
  window.location.href = '/'
})

// ===== GET ALL NOTES =====
async function getNotes() {
  // GET /api/notes — protected route, needs Authorization header
  const res = await fetch(`${API_URL}/data`, {
    method: 'GET',
    headers: authHeader()
  })

  const notes = await res.json()

  if (!res.ok) {
    // If the request failed, show the error in the notes container
    document.getElementById('notesList').textContent = notes.message || 'Failed to load notes'
    return
  }

  // Pass the notes array to the render function to display them on the page
  renderNotes(notes)
}

// ===== RENDER NOTES TO THE PAGE =====
function renderNotes(notes) {
  const container = document.getElementById('pricings')

  // Clear whatever was previously rendered so we don't get duplicates
  container.innerHTML = ''

  if (notes.length === 0) {
    container.textContent = 'No pricings found. Please insert prices.'
    return
  }

  // Loop through each note and create HTML elements for it
  notes.forEach(note => {
    const div = document.createElement('div')
    div.classList.add('price_display')

    div.innerHTML =`
      <p><strong>ID:</strong>${note.id}</p>
      <p><strong>Tier name:</strong>${note.tier_name}</p>
      <p><strong>Debugs allowed:</strong>${note.debug}</p>
      <p><strong>Price:</strong>${note.price}</p>
      <p><strong>One-on-One Time:</strong>${note.oneonone}</p>

      <button onclick = "deleteNote('${note.id}')">>Delete<</button>
      <button onclick = "startEdit('${note.id}','${note.tier_name}','${note.debug}','${note.price}','${note.oneonone}')">>Edit<</button>
      <hr>
    `
    container.appendChild(div)
  })
}

// ===== CREATE A NOTE =====
document.getElementById('createPriceForm').addEventListener('submit', async (e) => {
  // Prevent page refresh on form submit
  e.preventDefault()

  const id = document.getElementById('id').value
  const tier_name = document.getElementById('tier_name').value
  const debug = document.getElementById('debug').value
  const price = document.getElementById('price').value
  const oneonone = document.getElementById('oneonone').value

  // POST /api/notes — sends the note text in the request body
  const res = await fetch(`${API_URL}/data`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ 
      id,
      tier_name,
      debug,
      price,
      oneonone
     })
  })

  const data = await res.json()

  if (!res.ok) {
    // Show the error (e.g. "Please add a 'text' field")
    document.getElementById('createMsg').style.color = 'red'
    document.getElementById('createMsg').textContent = data.message || 'Failed to create pricing'
    return
  }

  // Show success message, clear the input, and refresh the notes list
  document.getElementById('createMsg').style.color = 'green'
  document.getElementById('createMsg').textContent = 'Pricing created!'
  getNotes()
})

// ===== DELETE A NOTE =====
async function deleteNote(id) {
  // Ask the user to confirm before permanently deleting
  const confirmed = confirm('Are you sure you want to delete this note?')
  if (!confirmed) return

  // DELETE /api/notes/:id — the id is in the URL, no request body needed
  const res = await fetch(`${API_URL}/data/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  })

  const data = await res.json()

  if (!res.ok) {
    alert(data.message || 'Failed to delete note')
    return
  }

  // Refresh the list so the deleted note disappears
  getNotes()
}

// ===== SHOW EDIT FORM =====
// Called when the user clicks the Edit button on a note
// Populates the hidden edit section with the current note's id and text
function startEdit(id, tier_name, debug, price, oneonone) {
  document.getElementById('editSection').style.display = 'flex'
  document.getElementById('editing').style.display = 'flex'

  document.getElementById('editid').value = id
  document.getElementById('edittier_name').value = tier_name
  document.getElementById('editdebug').value = debug
  document.getElementById('editprice').value = price
  document.getElementById('editoneonone').value = oneonone

  document.getElementById('editSection').scrollIntoView()
}

// ===== CANCEL EDIT =====
// Hide the edit form without making any changes
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
  document.getElementById('editSection').style.display = 'none'
  document.getElementById('editing').style.display = 'none'
})

// ===== SAVE EDIT =====
document.getElementById('saveEditBtn').addEventListener('click', async () => {
  // Read the note id (from the hidden input) and the updated text
  const id = Number(document.getElementById('editid').value)
  const tier_name = document.getElementById('edittier_name').value
  const debug = Number(document.getElementById('editdebug').value)
  const price = Number(document.getElementById('editprice').value)
  const oneonone = document.getElementById('editoneonone').value


  // PUT /api/data/:id — sends the updated text in the request body
  const res = await fetch(`${API_URL}/data/${id}`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ 
      tier_name,
      debug,
      price,
      oneonone
     })
  })

  const data = await res.json()

  if (!res.ok) {
    document.getElementById('editMsg').style.color = 'red'
    document.getElementById('editMsg').textContent = data.message || 'Failed to update pricing'
    return
  }

  // Show success, hide the edit form, and refresh the notes list
  document.getElementById('editMsg').style.color = 'green'
  document.getElementById('editMsg').textContent = 'Pricing updated!'
  document.getElementById('editSection').style.display = 'none'
  document.getElementById('editing').style.display = 'none'
  getNotes()
})

// ===== LOAD NOTES ON PAGE LOAD =====
// Automatically fetch and display all notes when index.html is opened
getNotes()