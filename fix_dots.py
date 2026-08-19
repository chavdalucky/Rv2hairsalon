import re

with open("src/components/Reviews.tsx", "r") as f:
    content = f.read()

# Add scrollSnaps state
state_search = "const [selectedIndex, setSelectedIndex] = useState(0);"
state_replace = "const [selectedIndex, setSelectedIndex] = useState(0);\n  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);"
content = content.replace(state_search, state_replace)

# Update onInit/onSelect to capture snap points
onselect_search = """  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);"""

onselect_replace = """  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const onInit = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onInit();
    onSelect();
    emblaApi.on('reInit', onInit);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);"""
content = content.replace(onselect_search, onselect_replace)

# Update the rendering of the dots
dots_search = """{reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}"""
dots_replace = """{scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}"""
content = content.replace(dots_search, dots_replace)

with open("src/components/Reviews.tsx", "w") as f:
    f.write(content)
