import bandsJson from './bands.json';
import { bandsSchema } from './schemas';

export const bands = bandsSchema.parse(bandsJson);
