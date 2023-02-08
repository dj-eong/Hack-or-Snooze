"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  return $(`
      <li id="${story.storyId}">
      ${isOwnStory(story)}
        <i class="${isFavorited(story) ? 'fas' : 'far'} fa-star hidden"></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function isFavorited(story) {
  if (currentUser) {
    for (let fav of currentUser.favorites) {
      if (story.storyId == fav.storyId) return true;
    }
  }
  return false;
}

function isOwnStory(story) {
  if (currentUser) {
    for (let own of currentUser.ownStories) {
      if (story.storyId == own.storyId) return `<span class="deleteButton hidden">x</span>`;
    }
  }
  return '';
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();

  if (currentUser) $('.fa-star').show();
}

async function submitStory(evt) {
  evt.preventDefault();
  const title = $("#story-title-input").val();
  const author = $("#story-author-input").val();
  const url = $("#story-url-input").val();
  const story = await storyList.addStory(currentUser, { title, author, url });
  currentUser.ownStories.unshift(story);
  putStoriesOnPage();

  $storyForm.trigger("reset");
  $storyForm.hide();
}

$storyForm.on('submit', submitStory);


function putFavoritesOnPage() {
  $favStoriesList.empty();

  if (currentUser.favorites.length == 0) {
    $favStoriesList.text('No favorites added!');
  } else {
    for (let favStory of currentUser.favorites) {
      const $favStory = generateStoryMarkup(favStory);
      $favStoriesList.append($favStory);
    }
  }
  hidePageComponents();
  $favStoriesList.show();
  $('.fa-star').show();
}

$('#nav-favorites').on('click', putFavoritesOnPage);

async function alterStarOnClick(evt) {
  const $star = $(evt.target);

  for (let story of storyList.stories) {
    if (story.storyId == evt.target.parentElement.id) {
      if ($star.hasClass('fas')) {
        await currentUser.deleteAFavorite(story);
        $star.toggleClass('far').toggleClass('fas');
      } else if ($star.hasClass('far')) {
        await currentUser.addAFavorite(story);
        $star.toggleClass('far').toggleClass('fas');
      }
    }
  }
}

$('.stories-container').on('click', '.fa-star', alterStarOnClick);

function putYourStoriesOnPage() {
  $ownStoriesList.empty();

  if (currentUser.ownStories.length == 0) {
    $ownStoriesList.text('No stories of your own.');
  } else {
    for (let ownStory of currentUser.ownStories) {
      const $ownStory = generateStoryMarkup(ownStory);
      $ownStoriesList.append($ownStory);
    }
  }
  hidePageComponents();
  $ownStoriesList.show();
  $('.fa-star').show();
  $('.deleteButton').show();
}

$('#nav-my-stories').on('click', putYourStoriesOnPage);

async function removeYourStory(evt) {
  for (let story of currentUser.ownStories) {
    if (story.storyId == evt.target.parentElement.id) {
      evt.target.parentElement.remove();
      storyList.stories = storyList.stories.filter(s => s.storyId !== story.storyId);
      await currentUser.deleteYourStory(story);
    }
  }
}

$('.stories-container').on('click', '.deleteButton', removeYourStory);
