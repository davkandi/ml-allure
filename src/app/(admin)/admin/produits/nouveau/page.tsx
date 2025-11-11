"use client";

// Force rebuild - cache invalidation for toast system fix
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stockQuantity: number;
  additionalPrice: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([
    {
      id: crypto.randomUUID(),
      size: "",
      color: "",
      colorHex: "#000000",
      stockQuantity: 0,
      additionalPrice: 0,
    },
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  }, [name]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: crypto.randomUUID(),
        size: "",
        color: "",
        colorHex: "#000000",
        stockQuantity: 0,
        additionalPrice: 0,
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length > 1) {
      setVariants(variants.filter((v) => v.id !== id));
    }
  };

  const handleVariantChange = (
    id: string,
    field: keyof Variant,
    value: string | number
  ) => {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast.error("Le nom du produit est requis");
      return false;
    }

    if (!categoryId) {
      toast.error("La catégorie est requise");
      return false;
    }

    if (!basePrice || parseFloat(basePrice) <= 0) {
      toast.error("Le prix de base doit être supérieur à 0");
      return false;
    }

    const hasEmptyVariant = variants.some(
      (v) => !v.size.trim() || !v.color.trim() || v.stockQuantity < 0
    );

    if (hasEmptyVariant) {
      toast.error("Tous les champs des variantes sont requis");
      return false;
    }

    return true;
  };

  const handleSubmit = async (status: "draft" | "publish") => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const productData = {
        name: name.trim(),
        slug: slug.trim(),
        description,
        categoryId,
        basePrice: parseFloat(basePrice),
        tags,
        images,
        isActive: status === "publish" ? isActive : false,
        isFeatured: status === "publish" ? isFeatured : false,
        variants: variants.map((v) => ({
          size: v.size.trim(),
          color: v.color.trim(),
          colorHex: v.colorHex,
          stockQuantity: parseInt(v.stockQuantity.toString()),
          additionalPrice: parseFloat(v.additionalPrice.toString()),
        })),
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Produit ${status === "draft" ? "enregistré comme brouillon" : "publié"} avec succès`);
        router.push("/admin/produits");
      } else {
        toast.error(data.message || "Impossible de créer le produit");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Ajouter un Produit
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez un nouveau produit dans votre catalogue
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom du produit <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Robe élégante"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Ex: robe-elegante"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Catégorie <span className="text-destructive">*</span>
              </Label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des catégories...
                </div>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div className="border rounded-md overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  modules={quillModules}
                  placeholder="Décrivez votre produit..."
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="basePrice">
                Prix de base (USD) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Ajouter un tag et appuyer sur Entrée"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Ajouter
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload images={images} onChange={setImages} maxImages={5} />
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Variantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={variant.id}
                className="p-4 border rounded-lg space-y-4 relative"
              >
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveVariant(variant.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Taille <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={variant.size}
                      onChange={(e) =>
                        handleVariantChange(variant.id, "size", e.target.value)
                      }
                      placeholder="Ex: M, L, 38, 40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Couleur <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={variant.color}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.id,
                            "color",
                            e.target.value
                          )
                        }
                        placeholder="Ex: Rouge, Bleu"
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        value={variant.colorHex}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.id,
                            "colorHex",
                            e.target.value
                          )
                        }
                        className="w-16"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Stock initial <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={variant.stockQuantity}
                      onChange={(e) =>
                        handleVariantChange(
                          variant.id,
                          "stockQuantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Prix additionnel (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.additionalPrice}
                      onChange={(e) =>
                        handleVariantChange(
                          variant.id,
                          "additionalPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddVariant}
              className="w-full"
            >
              Ajouter une variante
            </Button>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Produit actif</Label>
                <p className="text-sm text-muted-foreground">
                  Le produit sera visible sur la boutique
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Produit en vedette</Label>
                <p className="text-sm text-muted-foreground">
                  Afficher sur la page d'accueil
                </p>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Enregistrer comme brouillon
          </Button>
          <Button onClick={() => handleSubmit("publish")} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Publier
          </Button>
        </div>
      </div>
    </div>
  );
}