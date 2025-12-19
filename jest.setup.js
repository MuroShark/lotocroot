// Этот импорт расширяет возможности `expect` в Jest,
// добавляя матчеры для работы с DOM, такие как:
// expect(element).toBeInTheDocument()
// expect(element).toHaveTextContent(...)
// и другие.
import '@testing-library/jest-dom';
import 'whatwg-fetch';