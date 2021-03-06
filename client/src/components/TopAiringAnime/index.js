import React, { useEffect, useState } from 'react';
import Carousel from 'react-elastic-carousel';
import Item from '../Carousel/item';
import { getCategoryFavorites } from '../../utils/API';
import { Card, CardColumns, Button } from 'react-bootstrap';
import Auth from '../../utils/auth';
import { saveAnimeIds, getSavedAnimeIds } from '../../utils/localStorage';
import { useMutation } from '@apollo/react-hooks';
import { SAVE_ANIME } from '../../utils/mutations';

const TopAiring = () => {
  const [searchedAnimes, setSearchedAnimes] = useState([]);

  const [savedAnimeIds, setSavedAnimeIds] = useState(getSavedAnimeIds());

  const [saveAnime] = useMutation(SAVE_ANIME);

  const breakPoints = [
    { width: 1, itemsToShow: 1 },
    { width: 550, itemsToShow: 2, itemsToScroll: 2 },
    { width: 768, itemsToShow: 3 },
    { width: 1200, itemsToShow: 4 },
  ];

  useEffect(() => {
    return () => saveAnimeIds(savedAnimeIds);
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getCategoryFavorites();

        if (!response.ok) {
          throw new Error('something went wrong!');
        }

        const { top } = await response.json();

        const animeData = top.map((anime) => ({
          animeId: anime.mal_id,
          title: anime.title,
          score: anime.score,
          image: anime.image_url || '',
          link: anime.url,
        }));

        setSearchedAnimes(animeData);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const handleSaveAnime = async (animeId) => {
    // find the book in `searchedAnime` state by the matching id
    const animeToSave = searchedAnimes.find(
      (anime) => anime.animeId === animeId
    );

    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      await saveAnime({
        variables: { ...animeToSave },
      });

      // if book successfully saves to user's account, save book id to state
      setSavedAnimeIds([...savedAnimeIds, animeToSave.animeId]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="title">Trending Anime</h2>
      <CardColumns className="search-container carousel">
        <Carousel className="slider" breakPoints={breakPoints}>
          {searchedAnimes.map((anime) => {
            return (
              <Item key={anime.animeId}>
                <Card className="anime-card">
                  {anime.image ? (
                    <a
                      href={anime.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Card.Img
                        src={anime.image}
                        alt={`The cover for ${anime.title}`}
                        variant="top"
                      />{' '}
                    </a>
                  ) : null}
                  <Card.Body>
                    <Card.Title>{anime.title}</Card.Title>
                    <p className="small">Score: {anime.score}/10</p>
                    {Auth.loggedIn() && (
                      <Button
                        disabled={savedAnimeIds?.some(
                          (savedAnimeId) => savedAnimeId === anime.animeId
                        )}
                        name="addAnime"
                        className="anime-btn"
                        onClick={() => handleSaveAnime(anime.animeId)}
                      >
                        {savedAnimeIds?.some(
                          (savedAnimeId) => savedAnimeId === anime.animeId
                        )
                          ? 'This anime has already been saved!'
                          : 'Save this anime!'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Item>
            );
          })}
        </Carousel>
      </CardColumns>
    </div>
  );
};

export default TopAiring;
