import './css/styles.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import axios from 'axios';
import InfiniteAjaxScroll from '@webcreate/infinite-ajax-scroll';

const API_KEY = '34312936-3db2b38440e9c869606467039';
const URL = 'https://pixabay.com/api/';
const STORAGE_KEY = 'search-form-state';

const searchForm = document.querySelector('#search-form');
const searchBtn = searchForm.querySelector('button');

const galleryItems = document.querySelector('.gallery');
const loadBtn = document.querySelector('[type="button"]');
let searchPage = 1;

searchForm.addEventListener('input', () => {
  searchBtn.disabled = false;
});

searchForm.addEventListener('submit', onSubmitForm);
function onSubmitForm(event) {
  event.preventDefault();
  cleanImages();
  const {
    elements: { searchQuery },
  } = event.currentTarget;
  if (!searchQuery.value) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, searchQuery.value);

  getImg();

  searchBtn.disabled = true;
}

loadBtn.addEventListener('click', onClickLoadBtn);
function onClickLoadBtn() {
  getImg();
}

async function getImg() {
  try {
    const response = await axios.get(URL, {
      params: {
        key: API_KEY,
        q: localStorage.getItem(STORAGE_KEY),
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: 'true',
        page: searchPage,
        per_page: 40,
      },
    });
    if (!response.data.hits.length) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    if (searchPage === 1) {
      Notify.success(`Hooray! We found ${response.data.totalHits} images.`);
    }
    renderImages(response.data.hits);

    if (Math.ceil(response.data.totalHits / 40) === searchPage) {
      Notify.failure(
        "We're sorry, but you've reached the end of search results."
      );
      loadBtn.classList.add('hidden');
      return;
    }

    loadBtn.classList.remove('hidden');
    searchPage += 1;
  } catch (error) {
    console.error(error);
  }
}

function renderImages(imagesArray) {
  const markup = imagesArray
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<a class="gallery__item" href="${largeImageURL}"
        <div class="photo-card">
        <img class="gallery__image" src="${webformatURL}" alt="${tags}" loading="lazy" />
        <div class="info">
          <p class="info-item">
            <b>Likes</b> ${likes}
          </p>
          <p class="info-item">
            <b>Views</b> ${views}
          </p>
          <p class="info-item">
            <b>Comments</b> ${comments}
          </p>
          <p class="info-item">
            <b>Downloads</b> ${downloads}
          </p>
        </div>
      </div>
      </a>`;
      }
    )
    .join('');

  galleryItems.insertAdjacentHTML('beforeend', markup);
  let gallery = new SimpleLightbox('.gallery__item');
  gallery.refresh();

  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });

  if (imagesArray.length === 40) {
    window.ias = new InfiniteAjaxScroll('.gallery', {
      item: '.gallery__item',
      next: getImg,
      pagination: false,
    });
  }
}

function cleanImages() {
  galleryItems.innerHTML = '';
  localStorage.removeItem(STORAGE_KEY);
  searchPage = 1;
}
