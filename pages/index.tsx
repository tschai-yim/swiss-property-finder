import App from '../App';
import { getLatestSearch } from '../server/services/savedSearchService';
import { FilterCriteria } from '../types';
import { GetServerSideProps } from 'next';

const HomePage = ({ savedFilters }: { savedFilters: FilterCriteria }) => {
  return <App savedFilters={savedFilters} />;
};

export const getServerSideProps: GetServerSideProps = async () => {
  const savedFilters = await getLatestSearch();
  return {
    props: {
      savedFilters,
    },
  };
};

export default HomePage;
