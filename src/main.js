import './style.css'
import { createGallery } from './gallery/gallery.js'
import { dotField } from './gallery/dot-field.js'

dotField(document.querySelector('.bg-field'))
createGallery(document.querySelector('.page'))
