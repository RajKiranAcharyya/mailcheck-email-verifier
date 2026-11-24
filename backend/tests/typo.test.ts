import { TypoService } from '../src/services/typo.service';

describe('Typo Suggestions Tests', () => {
  let typoService: TypoService;

  beforeEach(() => {
    typoService = new TypoService();
  });

  it('should suggest gmail.com for common typos', () => {
    expect(typoService.suggest('user@gmial.com')).toBe('user@gmail.com');
    expect(typoService.suggest('user@gamil.com')).toBe('user@gmail.com');
    expect(typoService.suggest('alex@gmaill.com')).toBe('alex@gmail.com');
  });

  it('should suggest yahoo.com for typos', () => {
    expect(typoService.suggest('user@yaho.com')).toBe('user@yahoo.com');
    expect(typoService.suggest('user@yahooo.com')).toBe('user@yahoo.com');
  });

  it('should suggest hotmail.com and outlook.com for typos', () => {
    expect(typoService.suggest('user@hotmial.com')).toBe('user@hotmail.com');
    expect(typoService.suggest('user@outlok.com')).toBe('user@outlook.com');
  });

  it('should return null for correctly spelled domains', () => {
    expect(typoService.suggest('user@gmail.com')).toBeNull();
    expect(typoService.suggest('user@outlook.com')).toBeNull();
    expect(typoService.suggest('user@yahoo.com')).toBeNull();
  });

  it('should return null for unrelated domains where distance is large', () => {
    expect(typoService.suggest('user@customdomaincorp.org')).toBeNull();
    expect(typoService.suggest('user@acme-enterprises.net')).toBeNull();
  });
});
