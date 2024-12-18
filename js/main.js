const canvas = document.getElementById('paintCanvas')
const ctx = canvas.getContext('2d')

const clearBtn = document.getElementById('clearBtn')
const colorPicker = document.getElementById('colorPicker')
const brushSizeInput = document.getElementById('brushSize')
const shapeSelector = document.getElementById('shapeSelector')
const saveBtn = document.getElementById('saveBtn')
const shareBtn = document.getElementById('shareBtn')

let drawing = false
let brushColor = colorPicker.value
let brushSize = brushSizeInput.value
let shapeType = shapeSelector.value

colorPicker.addEventListener('input', (e) => {
    brushColor = e.target.value
})

brushSizeInput.addEventListener('input', (e) => {
    brushSize = e.target.value
})

shapeSelector.addEventListener('change', (e) => {
    shapeType = e.target.value
})

shareBtn.addEventListener('click', async () => {
    const imageDataURL = canvas.toDataURL('image/png')


    const blob = await (await fetch(imageDataURL)).blob()

    const cloudName = 'ENTER_YOUR_CLOUD_NAME' 
    const apiKey = 'ENTER_YOUR_API_KEY' 
    const apiSecret = 'ENTER_YOUR_SECRET_API_KEY' 
    const cloudinaryURL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

    const timestamp = Math.floor(Date.now() / 1000) 

    const paramsToSign = `timestamp=${timestamp}` 
    const signature = CryptoJS.SHA1(`${paramsToSign}${apiSecret}`).toString()

    const formData = new FormData()
    formData.append('file', blob)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp)
    formData.append('signature', signature)

    try {
        const response = await fetch(cloudinaryURL, {
            method: 'POST',
            body: formData,
        })

        const data = await response.json()

        if (data.secure_url) {
            const uploadedImageURL = data.secure_url

            const facebookShareURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                uploadedImageURL
            )}`

            window.open(facebookShareURL, '_blank')
        } else {
            alert('Failed to upload the image to Cloudinary')
        }
    } catch (error) {
        console.error('Error uploading image:', error)
        alert('An error occurred while sharing to Facebook')
    }
})



function startDrawing(e, isTouch = false) {
    e.preventDefault()
    drawing = true
    const { x, y } = getCoordinates(e, isTouch)

    if (shapeType === 'pencil') {
        ctx.beginPath()
        ctx.moveTo(x, y)
    } else {
        drawShape(x, y) 
    }
}


function draw(e, isTouch = false) {
    if (!drawing) return
    const { x, y } = getCoordinates(e, isTouch)

    if (shapeType === 'pencil') {
        ctx.lineWidth = brushSize
        ctx.lineCap = 'round'
        ctx.strokeStyle = brushColor
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.moveTo(x, y)
    } else {
        drawShape(x, y)
    }
}

function stopDrawing() {
    drawing = false
    ctx.beginPath()
}

function drawShape(x, y) {
    const shapeSize = brushSize * 2 
    const outlineWidth = Math.max(1, brushSize / 5) 

    ctx.strokeStyle = brushColor
    ctx.lineWidth = outlineWidth 

    ctx.beginPath()
    switch (shapeType) {
        case 'circle':
            ctx.arc(x, y, shapeSize, 0, Math.PI * 2) 
            break
        case 'square':
            ctx.rect(x - shapeSize / 2, y - shapeSize / 2, shapeSize, shapeSize) 
            break
        case 'triangle':
            ctx.moveTo(x, y - shapeSize) 
            ctx.lineTo(x - shapeSize, y + shapeSize)
            ctx.lineTo(x + shapeSize, y + shapeSize)
            ctx.closePath()
            break
    }
    ctx.stroke() // Draw the outline
}


// Get Coordinates (Mouse and Touch)
function getCoordinates(e, isTouch) {
    if (isTouch) {
        const touch = e.touches[0]
        return {
            x: touch.clientX - canvas.offsetLeft,
            y: touch.clientY - canvas.offsetTop,
        }
    } else {
        return {
            x: e.clientX - canvas.offsetLeft,
            y: e.clientY - canvas.offsetTop,
        }
    }
}


clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
})

saveBtn.addEventListener('click', () => {
    const imageURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = imageURL
    link.download = 'my-drawing.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
})

canvas.addEventListener('mousedown', (e) => startDrawing(e, false))
canvas.addEventListener('mousemove', (e) => draw(e, false))
canvas.addEventListener('mouseup', stopDrawing)
canvas.addEventListener('mouseout', stopDrawing)

canvas.addEventListener('touchstart', (e) => startDrawing(e, true))
canvas.addEventListener('touchmove', (e) => draw(e, true))
canvas.addEventListener('touchend', stopDrawing)
