-- Insert parent categories
INSERT INTO "Category" (id, name, "parentId") VALUES
  ('66e6ec1e-083e-4305-b933-039db6529f9b', 'Business', NULL);


-- Insert children categories
INSERT INTO "Category" (id, name, "parentId") VALUES
  ('66e6ec1e-083e-4305-b933-039db6529f9b', 'Business - Incomes', '66e6ec1e-083e-4305-b933-039db6529f9b'),
  ('66e6ec1e-083e-4305-b933-039db6529f9b', 'Business - Equipment', '66e6ec1e-083e-4305-b933-039db6529f9b'),
  ('66e6ec1e-083e-4305-b933-039db6529f9b', 'Business - Other expenses', '66e6ec1e-083e-4305-b933-039db6529f9b');
  

