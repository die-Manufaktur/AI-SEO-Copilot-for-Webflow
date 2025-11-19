declare module 'test-data-bot' {
  // Faker types - based on @faker-js/faker structure
  interface FakerHelpers {
    arrayElement<T>(array: T[]): T;
    slugify(string: string): string;
  }

  interface FakerLorem {
    word(): string;
    words(options?: { min?: number; max?: number }): string;
    sentence(options?: { min?: number; max?: number }): string;
    sentences(options?: { min?: number; max?: number }): string;
    paragraph(options?: { min?: number; max?: number }): string;
    paragraphs(options?: { min?: number; max?: number } | number, separator?: string): string;
  }

  interface FakerInternet {
    email(): string;
    url(): string;
    domainName(): string;
    domainWord(): string;
  }

  interface FakerPerson {
    firstName(): string;
    lastName(): string;
  }

  interface FakerCompany {
    name(): string;
  }

  interface FakerLocation {
    timeZone(): string;
  }

  interface FakerDate {
    past(): Date;
    recent(): Date;
  }

  interface FakerNumber {
    int(options?: { min?: number; max?: number }): number;
  }

  interface FakerDatatype {
    boolean(): boolean;
  }

  interface FakerImage {
    url(): string;
    avatar(): string;
  }

  interface FakerCommerce {
    productName(): string;
    productDescription(): string;
    price(): string;
  }

  interface FakerString {
    alphanumeric(length: number): string;
  }

  interface FakerInstance {
    helpers: FakerHelpers;
    lorem: FakerLorem;
    internet: FakerInternet;
    person: FakerPerson;
    company: FakerCompany;
    location: FakerLocation;
    date: FakerDate;
    number: FakerNumber;
    datatype: FakerDatatype;
    image: FakerImage;
    commerce: FakerCommerce;
    string: FakerString;
  }

  // Test data bot function types
  type FakeFunction<T> = (faker: FakerInstance) => T;
  type SequenceFunction<T> = (index: number) => T;

  export function fake<T>(fn: FakeFunction<T>): T;
  export function sequence<T>(fn: SequenceFunction<T>): T;

  // Builder type for creating factory objects
  export interface Builder<T> {
    (overrides?: Partial<T>): T;
    extend(overrides: Partial<T>): Builder<T>;
  }

  export function build<T>(name: string, definition: Partial<Record<keyof T, any>>): Builder<T>;
}