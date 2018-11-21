#![feature(extern_crate_item_prelude)]

extern crate proc_macro;
extern crate quote;
extern crate syn;

use proc_macro::TokenStream as TS1;
use quote::quote;
use syn::parse::{Parse, ParseStream, Result};
use syn::*;

#[allow(unused)]
struct Input {
    attrs: Vec<Attribute>,
    vis: Visibility,
    struct_token: Token![struct],
    ident: Ident,
    brace_token: token::Brace,
    fields: punctuated::Punctuated<InputField, Token![,]>,
}

#[allow(unused)]
struct InputField {
    attrs: Vec<Attribute>,
    name: Ident,
    colon_token: Token![:],
    ty: Type,
}

impl Parse for Input {
    fn parse(input: ParseStream) -> Result<Self> {
        let content;
        Ok(Input {
            attrs: Attribute::parse_outer(input)?,
            vis: input.parse()?,
            struct_token: input.parse()?,
            ident: input.parse()?,
            brace_token: braced!(content in input),
            fields: content.parse_terminated(InputField::parse)?,
        })
    }
}

impl Parse for InputField {
    fn parse(input: ParseStream) -> Result<Self> {
        Ok(InputField {
            attrs: Attribute::parse_outer(input)?,
            name: input.parse()?,
            colon_token: input.parse()?,
            ty: input.parse()?,
        })
    }
}

fn get_optional(field: &InputField) -> Option<Type> {
    let path = match &field.ty {
        Type::Path(path) => &path.path,
        _ => return None,
    };
    if path.segments.len() != 1 {
        return None;
    }
    let segment = &path.segments[0];
    if segment.ident != "Option" {
        return None;
    }
    let arguments = match &segment.arguments {
        PathArguments::AngleBracketed(args) => args,
        _ => return None,
    };
    if arguments.args.len() != 1 {
        return None;
    }
    let ty = match &arguments.args[0] {
        GenericArgument::Type(ty) => ty,
        _ => return None,
    };
    Some(ty.clone())
}

#[proc_macro_derive(Api)]
pub fn derive_api(input: TS1) -> TS1 {
    let input = parse_macro_input!(input as Input);
    let ident = input.ident;
    let mut setters = Vec::new();
    let mut required_names = Vec::new();
    let mut required_types = Vec::new();
    let mut optional_names = Vec::new();
    for field in input.fields {
        if let Some(inner_ty) = get_optional(&field) {
            let doc_attrs = field
                .attrs
                .into_iter()
                .filter(|attr| attr.path.is_ident("doc"))
                .collect::<Vec<_>>();
            let name = field.name;
            setters.push(quote! {
                #(#doc_attrs)*
                pub fn #name(&mut self, #name: impl Into<#inner_ty>) -> &mut Self {
                    self.#name = Some(#name.into());
                    self
                }
            });
            optional_names.push(name);
        } else {
            required_names.push(field.name);
            required_types.push(field.ty);
        }
    }
    let rn1 = required_names.clone();
    let rn2 = required_names.clone();
    let expanded = quote! {
        impl #ident {
            pub fn new(#(#required_names: impl Into<#required_types>,)*) -> Self {
                #ident {
                    #(#rn1: #rn2.into(),)*
                    #(#optional_names: None,)*
                }
            }
            #(#setters)*
        }
    };
    TS1::from(expanded)
}
