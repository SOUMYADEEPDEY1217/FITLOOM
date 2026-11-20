"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_GARMENTS, computeMockFitPreview } from "@/lib/mock-data";
import { useFitloom } from "@/components/providers/fitloom-provider";
import ProductCategory from "@/components/ui/product-category-04";

const CATEGORIES = [
  "All",
  "Shirts",
  "Outerwear",
  "Trousers",
  "T-Shirts",
] as const;

export function DiscoveryCarouselSection() {
  const router = useRouter();
  const { user, bodyProfile, addToCart, wishlistIds, toggleWishlist, toast } =
    useFitloom();
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof CATEGORIES)[number]>("All");
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleAddMockCart(garmentId: string) {
    if (user.role === "guest") {
      toast({
        type: "info",
        title: "Sign-In Required",
        message: "Please sign in to add garments to your shopping bag.",
      });
      router.push("/login?next=%2Fcart");
      return;
    }
    const garment = MOCK_GARMENTS.find((g) => g.id === garmentId);
    if (!garment) return;
    const rec = computeMockFitPreview(bodyProfile, garment);
    addToCart({
      garmentId: garment.id,
      name: garment.name,
      size: rec.recommendedSize,
      priceInr: garment.priceInr,
    });
    setJustAddedId(garment.id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustAddedId(null), 1600);
    toast({
      type: "success",
      title: "Added to Cart",
      message: `${garment.name} (Size ${rec.recommendedSize}) added to your shopping bag.`,
      action: { label: "View Cart", href: "/cart" },
    });
  }

  function handleToggleWishlist(garmentId: string) {
    if (user.role === "guest") {
      toast({
        type: "info",
        title: "Sign-In Required",
        message: "Please sign in to save garments to your wishlist.",
      });
      router.push("/login?next=%2Fwishlist");
      return;
    }
    const garment = MOCK_GARMENTS.find((g) => g.id === garmentId);
    const removing = wishlistIds.includes(garmentId);
    toggleWishlist(garmentId);
    toast({
      type: removing ? "info" : "success",
      title: removing ? "Removed from Wishlist" : "Saved to Wishlist",
      message: `${garment?.name ?? "Item"} ${removing ? "removed from" : "saved to"} your wishlist.`,
      action: removing ? undefined : { label: "Wishlist", href: "/wishlist" },
    });
  }

  function handleProductClick(garmentId: string, e: React.MouseEvent<HTMLAnchorElement>) {
    if (user.role === "guest") {
      e.preventDefault();
      toast({
        type: "info",
        title: "Sign-In Required",
        message: "Please sign in to view garment details and fit recommendations.",
      });
      router.push(`/login?next=${encodeURIComponent(`/shop/${garmentId}`)}`);
    }
  }

  return (
    <ProductCategory
      id="featured-collection"
      title="Featured Collection"
      subtitle="Explore pieces across shirts, outerwear, trousers, and knit tees, sized against your active Body Profile."
      browseShopHref="/shop"
      browseShopLabel="Browse Full Shop"
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onSelectCategory={(cat) => setSelectedCategory(cat as (typeof CATEGORIES)[number])}
      garments={MOCK_GARMENTS}
      bodyProfile={bodyProfile}
      wishlistIds={wishlistIds}
      justAddedId={justAddedId}
      onAddToCart={handleAddMockCart}
      onToggleWishlist={handleToggleWishlist}
      onProductClick={handleProductClick}
    />
  );
}
